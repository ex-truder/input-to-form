import * as THREE from "three";
import { evaluateKeyframes, resolveManifestAsset } from "./pbrAnimation";

const MAP_PROPERTIES = {
  baseColor: "map",
  normal: "normalMap",
  roughness: "roughnessMap",
  metalness: "metalnessMap",
  ao: "aoMap",
  emissive: "emissiveMap",
};

function setTextureColorSpace(texture, semantic) {
  texture.colorSpace = semantic === "baseColor" || semantic === "emissive"
    ? THREE.SRGBColorSpace
    : THREE.NoColorSpace;
  texture.flipY = false;
  texture.needsUpdate = true;
  return texture;
}

async function loadTexture(textureLoaders, manifestUrl, path, semantic, textureCache) {
  if (!path) return null;
  const url = resolveManifestAsset(manifestUrl, path);
  const cacheKey = `${semantic}:${url}`;
  const loader = new URL(url).pathname.toLowerCase().endsWith(".ktx2")
    ? textureLoaders.ktx2
    : textureLoaders.regular;
  if (!textureCache.has(cacheKey)) {
    textureCache.set(
      cacheKey,
      loader.loadAsync(url).then((texture) => setTextureColorSpace(texture, semantic)),
    );
  }
  return textureCache.get(cacheKey);
}

function createNeutralTexture(semantic) {
  const colors = {
    baseColor: [255, 255, 255, 255],
    normal: [128, 128, 255, 255],
    roughness: [255, 255, 255, 255],
    metalness: [0, 0, 0, 255],
    ao: [255, 255, 255, 255],
    emissive: [0, 0, 0, 255],
  };
  const texture = new THREE.DataTexture(new Uint8Array(colors[semantic]), 1, 1, THREE.RGBAFormat);
  setTextureColorSpace(texture, semantic);
  return texture;
}

async function loadMapSet(definition, textureLoaders, manifestUrl, textureCache) {
  const maps = definition?.maps || {};
  const result = {};

  for (const semantic of Object.keys(MAP_PROPERTIES)) {
    result[semantic] = await loadTexture(
      textureLoaders,
      manifestUrl,
      maps[semantic],
      semantic,
      textureCache,
    );
  }

  if (maps.orm) {
    const orm = await loadTexture(textureLoaders, manifestUrl, maps.orm, "orm", textureCache);
    result.roughness ||= orm;
    result.metalness ||= orm;
    result.ao ||= orm;
  }

  return result;
}

function addShaderDeclaration(shader, declaration) {
  shader.fragmentShader = `${declaration}\n${shader.fragmentShader}`;
}

function patchShader(material, targetMaps, blendUniform) {
  const enabled = Object.entries(targetMaps)
    .filter(([, texture]) => Boolean(texture))
    .map(([semantic]) => semantic);

  if (!enabled.length) return;

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uPbrBlend = blendUniform;
    addShaderDeclaration(shader, "uniform float uPbrBlend;");

    if (targetMaps.baseColor) {
      shader.uniforms.uPbrBaseColorTo = { value: targetMaps.baseColor };
      addShaderDeclaration(shader, "uniform sampler2D uPbrBaseColorTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
          vec4 pbrBaseColorFrom = texture2D( map, vMapUv );
          vec4 pbrBaseColorTo = texture2D( uPbrBaseColorTo, vMapUv );
          diffuseColor *= mix( pbrBaseColorFrom, pbrBaseColorTo, uPbrBlend );
        #endif`,
      );
    }

    if (targetMaps.normal) {
      shader.uniforms.uPbrNormalTo = { value: targetMaps.normal };
      addShaderDeclaration(shader, "uniform sampler2D uPbrNormalTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        `#ifdef USE_NORMALMAP_OBJECTSPACE
          vec3 pbrNormalFrom = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
          vec3 pbrNormalTo = texture2D( uPbrNormalTo, vNormalMapUv ).xyz * 2.0 - 1.0;
          normal = normalize( mix( pbrNormalFrom, pbrNormalTo, uPbrBlend ) );
          #ifdef FLIP_SIDED
            normal = - normal;
          #endif
          #ifdef DOUBLE_SIDED
            normal = normal * faceDirection;
          #endif
          normal = normalize( normalMatrix * normal );
        #elif defined( USE_NORMALMAP_TANGENTSPACE )
          vec3 pbrNormalFrom = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
          vec3 pbrNormalTo = texture2D( uPbrNormalTo, vNormalMapUv ).xyz * 2.0 - 1.0;
          vec3 mapN = normalize( mix( pbrNormalFrom, pbrNormalTo, uPbrBlend ) );
          mapN.xy *= normalScale;
          normal = normalize( tbn * mapN );
        #elif defined( USE_BUMPMAP )
          normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
        #endif`,
      );
    }

    if (targetMaps.roughness) {
      shader.uniforms.uPbrRoughnessTo = { value: targetMaps.roughness };
      addShaderDeclaration(shader, "uniform sampler2D uPbrRoughnessTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        `float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          float pbrRoughnessFrom = texture2D( roughnessMap, vRoughnessMapUv ).g;
          float pbrRoughnessTo = texture2D( uPbrRoughnessTo, vRoughnessMapUv ).g;
          roughnessFactor *= mix( pbrRoughnessFrom, pbrRoughnessTo, uPbrBlend );
        #endif`,
      );
    }

    if (targetMaps.metalness) {
      shader.uniforms.uPbrMetalnessTo = { value: targetMaps.metalness };
      addShaderDeclaration(shader, "uniform sampler2D uPbrMetalnessTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <metalnessmap_fragment>",
        `float metalnessFactor = metalness;
        #ifdef USE_METALNESSMAP
          float pbrMetalnessFrom = texture2D( metalnessMap, vMetalnessMapUv ).b;
          float pbrMetalnessTo = texture2D( uPbrMetalnessTo, vMetalnessMapUv ).b;
          metalnessFactor *= mix( pbrMetalnessFrom, pbrMetalnessTo, uPbrBlend );
        #endif`,
      );
    }

    if (targetMaps.ao) {
      shader.uniforms.uPbrAoTo = { value: targetMaps.ao };
      addShaderDeclaration(shader, "uniform sampler2D uPbrAoTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <aomap_fragment>",
        `#ifdef USE_AOMAP
          float pbrAoFrom = texture2D( aoMap, vAoMapUv ).r;
          float pbrAoTo = texture2D( uPbrAoTo, vAoMapUv ).r;
          float ambientOcclusion = ( mix( pbrAoFrom, pbrAoTo, uPbrBlend ) - 1.0 ) * aoMapIntensity + 1.0;
          reflectedLight.indirectDiffuse *= ambientOcclusion;
          #if defined( USE_CLEARCOAT )
            clearcoatSpecularIndirect *= ambientOcclusion;
          #endif
          #if defined( USE_SHEEN )
            sheenSpecularIndirect *= ambientOcclusion;
          #endif
          #if defined( USE_ENVMAP ) && defined( STANDARD )
            float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
            reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
          #endif
        #endif`,
      );
    }

    if (targetMaps.emissive) {
      shader.uniforms.uPbrEmissiveTo = { value: targetMaps.emissive };
      addShaderDeclaration(shader, "uniform sampler2D uPbrEmissiveTo;");
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <emissivemap_fragment>",
        `#ifdef USE_EMISSIVEMAP
          vec3 pbrEmissiveFrom = texture2D( emissiveMap, vEmissiveMapUv ).rgb;
          vec3 pbrEmissiveTo = texture2D( uPbrEmissiveTo, vEmissiveMapUv ).rgb;
          totalEmissiveRadiance *= mix( pbrEmissiveFrom, pbrEmissiveTo, uPbrBlend );
        #endif`,
      );
    }
  };

  material.customProgramCacheKey = () => `pbr-blend:${enabled.sort().join(",")}`;
  material.needsUpdate = true;
}

function readFactors(material) {
  return {
    baseColor: [material.color.r, material.color.g, material.color.b, material.opacity],
    emissive: material.emissive ? [material.emissive.r, material.emissive.g, material.emissive.b] : [0, 0, 0],
    emissiveIntensity: material.emissiveIntensity ?? 1,
    roughness: material.roughness ?? 1,
    metalness: material.metalness ?? 0,
    normalScale: material.normalScale ? [material.normalScale.x, material.normalScale.y] : [1, 1],
    clearcoat: material.clearcoat ?? 0,
    clearcoatRoughness: material.clearcoatRoughness ?? 0,
    transmission: material.transmission ?? 0,
    thickness: material.thickness ?? 0,
    ior: material.ior ?? 1.5,
  };
}

function interpolateValue(from, to, progress) {
  if (Array.isArray(from)) {
    return from.map((value, index) => value + ((to[index] ?? value) - value) * progress);
  }
  return from + (to - from) * progress;
}

function applyFactors(material, from, to, progress) {
  const baseColor = interpolateValue(from.baseColor, to.baseColor, progress);
  material.color.setRGB(baseColor[0], baseColor[1], baseColor[2]);
  material.opacity = baseColor[3];
  material.transparent = baseColor[3] < 1;

  if (material.emissive) {
    const emissive = interpolateValue(from.emissive, to.emissive, progress);
    material.emissive.setRGB(emissive[0], emissive[1], emissive[2]);
  }

  for (const property of [
    "emissiveIntensity",
    "roughness",
    "metalness",
    "clearcoat",
    "clearcoatRoughness",
    "transmission",
    "thickness",
    "ior",
  ]) {
    if (property in material) material[property] = interpolateValue(from[property], to[property], progress);
  }

  if (material.normalScale) {
    const normalScale = interpolateValue(from.normalScale, to.normalScale, progress);
    material.normalScale.set(normalScale[0], normalScale[1]);
  }
}

function mergeFactors(defaults, configured) {
  return { ...defaults, ...(configured || {}) };
}

export async function createPbrMaterialTracks({ root, definitions, manifestUrl, ktx2Loader }) {
  const textureLoaders = {
    regular: new THREE.TextureLoader(),
    ktx2: ktx2Loader,
  };
  const textureCache = new Map();
  const ownedTextures = new Set();
  const ownedMaterials = new Set();
  const tracks = [];
  const materialUsers = new Map();

  root.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material, index) => {
      if (!materialUsers.has(material)) materialUsers.set(material, []);
      materialUsers.get(material).push({ object, index, isArray: Array.isArray(object.material) });
    });
  });

  for (const definition of definitions) {
    const matches = [...materialUsers.keys()].filter(
      (material) => definition.target === "*" || material.name === definition.target,
    );

    if (!matches.length) {
      throw new Error(`Material "${definition.target}" was not found in the GLB.`);
    }

    const fromMaps = await loadMapSet(definition.from, textureLoaders, manifestUrl, textureCache);
    const toMaps = await loadMapSet(definition.to, textureLoaders, manifestUrl, textureCache);
    Object.values(fromMaps).filter(Boolean).forEach((texture) => ownedTextures.add(texture));
    Object.values(toMaps).filter(Boolean).forEach((texture) => ownedTextures.add(texture));

    for (const original of matches) {
      const material = original.clone();
      material.name = original.name;
      ownedMaterials.add(material);

      for (const [semantic, property] of Object.entries(MAP_PROPERTIES)) {
        if (fromMaps[semantic]) material[property] = fromMaps[semantic];
        if (toMaps[semantic] && !material[property]) {
          material[property] = createNeutralTexture(semantic);
          ownedTextures.add(material[property]);
        }
      }

      const blendUniform = { value: 0 };
      patchShader(material, toMaps, blendUniform);

      const originalFactors = readFactors(material);
      const fromFactors = mergeFactors(originalFactors, definition.from?.factors);
      const toFactors = mergeFactors(fromFactors, definition.to?.factors);

      for (const user of materialUsers.get(original)) {
        if (user.isArray) {
          const next = [...user.object.material];
          next[user.index] = material;
          user.object.material = next;
        } else {
          user.object.material = material;
        }
      }

      tracks.push({
        update(progress) {
          const blend = evaluateKeyframes(
            definition.blend?.keyframes,
            progress,
            definition.blend?.easing,
          );
          blendUniform.value = blend;
          applyFactors(material, fromFactors, toFactors, blend);
        },
      });
    }
  }

  return {
    tracks,
    dispose() {
      ownedMaterials.forEach((material) => material.dispose());
      ownedTextures.forEach((texture) => texture.dispose());
    },
  };
}
