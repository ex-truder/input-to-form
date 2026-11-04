import { evaluateKeyframes, resolveManifestAsset, validateAnimationManifest } from "./pbrAnimation";
import { publicAsset } from "../../utils/publicAsset";
import { mixBaseColorPixels } from "./textureBlendMath";

async function loadImage(url, signal) {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`Texture request failed: ${response.status}`);
  return createImageBitmap(await response.blob(), { colorSpaceConversion: "none" });
}

// Public model-viewer APIs only: the canvas content is also visible to USDZ export.
export async function createSpineTextureBlend(viewer, signal) {
  const manifestUrl = publicAsset("/projects/arthritis/model-animation.json");
  const response = await fetch(manifestUrl, { signal });
  if (!response.ok) throw new Error(`Material manifest request failed: ${response.status}`);
  const manifest = validateAnimationManifest(await response.json());
  const tracks = [];
  const images = [];
  try {
    for (const definition of manifest.materials) {
      const material = viewer.model.materials.find(item => item.name === definition.target);
      if (!material) throw new Error(`Material not found: ${definition.target}`);
      const pbr = material.pbrMetallicRoughness;
      const factors = definition.from?.factors;
      if (factors) {
        pbr.setBaseColorFactor(factors.baseColor);
        pbr.setRoughnessFactor(factors.roughness);
        pbr.setMetallicFactor(factors.metalness);
      }
      if (definition.side) material.setDoubleSided(definition.side === "double");
      const glass = definition.shader?.parameters;
      if (glass) {
        material.setTransmissionFactor(glass.transmission);
        material.setThicknessFactor(glass.thickness);
        material.setIor(glass.ior);
      }
      const maps = [];
      for (const semantic of ["baseColor", "normal", "orm"]) {
        const fromPath = definition.from?.maps?.[semantic];
        const toPath = definition.to?.maps?.[semantic];
        if (!fromPath || !toPath) continue;
        const pngUrl = path => resolveManifestAsset(manifestUrl, path.replace("textures/", "textures-web/").replace(/\.ktx2$/, ".png"));
        // Sequential acquisition makes ownership explicit if a request is aborted.
        const from = await loadImage(pngUrl(fromPath), signal);
        images.push(from);
        const to = await loadImage(pngUrl(toPath), signal);
        images.push(to);
        signal.throwIfAborted();
        const texture = viewer.createCanvasTexture();
        const canvas = texture.source.element;
        canvas.width = from.width;
        canvas.height = from.height;
        const context = canvas.getContext("2d");
        // model-viewer's canvas textures use flipY=true, unlike GLTF image maps.
        context.setTransform(1, 0, 0, -1, 0, canvas.height);
        context.drawImage(from, 0, 0);
        let pixels;
        if (semantic === "baseColor") {
          const start = context.getImageData(0, 0, canvas.width, canvas.height);
          context.drawImage(to, 0, 0);
          const end = context.getImageData(0, 0, canvas.width, canvas.height);
          pixels = { start, end, output: context.createImageData(canvas.width, canvas.height) };
          context.putImageData(start, 0, 0);
        }
        texture.source.update();
        if (semantic === "baseColor") pbr.baseColorTexture.setTexture(texture);
        if (semantic === "normal") material.normalTexture.setTexture(texture);
        if (semantic === "orm") {
          pbr.metallicRoughnessTexture.setTexture(texture);
          material.occlusionTexture.setTexture(texture);
        }
        maps.push({ texture, context, from, to, pixels });
      }
      tracks.push({ definition, maps, lastBlend: -1 });
    }
    return {
      duration: manifest.timeline.duration,
      update(progress) {
        for (const track of tracks) {
          const blend = evaluateKeyframes(track.definition.blend?.keyframes, progress, track.definition.blend?.easing);
          if (Math.abs(blend - track.lastBlend) < 0.001) continue;
          track.lastBlend = blend;
          for (const { texture, context, from, to, pixels } of track.maps) {
            if (pixels) {
              mixBaseColorPixels(pixels.start.data, pixels.end.data, blend, pixels.output.data);
              context.putImageData(pixels.output, 0, 0);
            } else {
              context.globalAlpha = 1;
              context.drawImage(from, 0, 0);
              context.globalAlpha = blend;
              context.drawImage(to, 0, 0);
              context.globalAlpha = 1;
            }
            texture.source.update();
          }
        }
      },
      dispose() { images.forEach(image => image.close()); },
    };
  } catch (error) {
    images.forEach(image => image.close());
    throw error;
  }
}
