import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { EXRLoader } from "three/addons/loaders/EXRLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { publicAsset } from "../../utils/publicAsset";
import { useLocale } from "../../i18n/useLocale";
import { advanceTimeline, resolveManifestAsset, validateAnimationManifest } from "./pbrAnimation";
import { createPbrMaterialTracks } from "./pbrBlendMaterial";
import { createBundledDracoLoader } from "./createBundledDracoLoader";
import { createBundledKtx2Loader } from "./createBundledKtx2Loader";

const LOOP_LABELS = {
  once: { en: "Once", ru: "Один раз" },
  "ping-pong": { en: "Ping-pong", ru: "Туда-обратно" },
  wrap: { en: "Loop", ru: "По кругу" },
};

function FullscreenIcon({ active }) {
  return active ? (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
      <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function selectClips(animations, timeline) {
  const requested = timeline.clips ?? timeline.clip;
  if (requested === "*" || (Array.isArray(requested) && requested.includes("*"))) return animations;

  const names = Array.isArray(requested) ? requested : requested ? [requested] : [];
  if (!names.length) return animations.slice(0, 1);

  const selected = names.map((name) => animations.find((clip) => clip.name === name));
  const missing = names.filter((name, index) => !selected[index]);
  if (missing.length) throw new Error(`Animation clip not found: ${missing.join(", ")}.`);
  return selected;
}

function fitCameraToObject(camera, controls, object) {
  const box = new THREE.Box3().setFromObject(object);
  const sphere = box.getBoundingSphere(new THREE.Sphere());
  const radius = Math.max(sphere.radius, 0.001);
  const distance = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov * 0.5));

  controls.target.copy(sphere.center);
  camera.position.copy(sphere.center).add(new THREE.Vector3(0, radius * 0.2, distance * 1.1));
  camera.near = Math.max(distance / 100, 0.001);
  camera.far = distance * 100;
  camera.updateProjectionMatrix();
  controls.minDistance = radius * 0.45;
  controls.maxDistance = distance * 3;
  controls.update();
}

function disposeScene(root) {
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.geometry?.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    materials.forEach((material) => material?.dispose());
  });
}

async function loadEnvironment(environmentPath, manifestUrl, pmrem, keepBackground) {
  const url = resolveManifestAsset(manifestUrl, environmentPath);
  const extension = new URL(url).pathname.split(".").pop()?.toLowerCase();
  const loader = extension === "exr" ? new EXRLoader() : extension === "hdr" ? new RGBELoader() : null;

  if (!loader) {
    throw new Error(`Unsupported environment format ".${extension || "unknown"}". Use an HDR or EXR file.`);
  }

  const source = await loader.loadAsync(url);
  source.mapping = THREE.EquirectangularReflectionMapping;
  const environment = pmrem.fromEquirectangular(source).texture;
  if (!keepBackground) source.dispose();
  return { environment, background: keepBackground ? source : null };
}

export default function PbrAnimatedModel({
  src,
  animationConfig,
  poster,
  alt,
  className = "aspect-video min-h-0",
}) {
  const locale = useLocale();
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const progressInputRef = useRef(null);
  const runtimeRef = useRef(null);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const [loopMode, setLoopMode] = useState("wrap");
  const [containerBackground, setContainerBackground] = useState("#f4f4f5");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenSupported, setFullscreenSupported] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    setFullscreenSupported(Boolean(document.fullscreenEnabled && container?.requestFullscreen));

    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === container);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas || !src || !animationConfig) return undefined;

    let cancelled = false;
    let frameId;
    let resizeObserver;
    let visibilityObserver;
    let visible = true;
    let pbrRuntime;
    let gltfRoot;
    let environmentBackground;
    const dracoLoader = createBundledDracoLoader();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    const ktx2Loader = createBundledKtx2Loader(renderer);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 1000);
    const controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = false;

    const pmrem = new THREE.PMREMGenerator(renderer);
    let environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = environment;

    const timelineState = { time: 0, direction: 1 };
    const clock = new THREE.Clock();
    let lastUiUpdate = 0;

    const resize = () => {
      const { width, height } = container.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    const initialise = async () => {
      try {
        const manifestUrl = publicAsset(animationConfig);
        const response = await fetch(manifestUrl);
        if (!response.ok) throw new Error(`Animation manifest could not be loaded (${response.status}).`);
        const manifest = validateAnimationManifest(await response.json());
        const viewer = manifest.viewer || {};

        const background = viewer.background ?? "#f4f4f5";
        const transparentBackground = background === "transparent";
        setContainerBackground(transparentBackground ? "transparent" : background);
        renderer.setClearColor(transparentBackground ? 0x000000 : new THREE.Color(background), transparentBackground ? 0 : 1);
        scene.background = transparentBackground ? null : new THREE.Color(background);

        if (viewer.environment) {
          const loaded = await loadEnvironment(viewer.environment, manifestUrl, pmrem, viewer.showEnvironment);
          if (cancelled) {
            loaded.environment.dispose();
            loaded.background?.dispose();
            return;
          }
          environment.dispose();
          environment = loaded.environment;
          environmentBackground = loaded.background;
          scene.environment = environment;
        }

        scene.environmentIntensity = viewer.environmentIntensity ?? 1;
        if (viewer.showEnvironment) scene.background = environmentBackground || environment;

        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);
        const gltf = await gltfLoader.loadAsync(publicAsset(src));
        if (cancelled) return;

        gltfRoot = gltf.scene;
        scene.add(gltfRoot);
        pbrRuntime = await createPbrMaterialTracks({
          root: gltfRoot,
          definitions: manifest.materials,
          manifestUrl,
          ktx2Loader,
        });
        if (cancelled) return;

        const selectedClips = selectClips(gltf.animations, manifest.timeline);
        const mixer = new THREE.AnimationMixer(gltfRoot);
        const actions = selectedClips.map((clip) => {
          const action = mixer.clipAction(clip);
          action.play();
          action.paused = true;
          return { action, duration: clip.duration };
        });
        const duration = manifest.timeline.duration || Math.max(...selectedClips.map((clip) => clip.duration), 1);
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const applyProgress = (progress, forceUi = false) => {
          actions.forEach(({ action, duration: clipDuration }) => {
            action.time = progress * clipDuration;
          });
          mixer.update(0);
          pbrRuntime.tracks.forEach((track) => track.update(progress));

          const now = performance.now();
          if (progressInputRef.current && (forceUi || now - lastUiUpdate > 50)) {
            progressInputRef.current.value = String(progress);
            lastUiUpdate = now;
          }
        };

        const runtime = {
          manifest,
          duration,
          mixer,
          actions,
          playing: Boolean(manifest.timeline.autoplay) && !reduceMotion,
          applyProgress,
          setProgress(progress) {
            const next = Math.min(Math.max(progress, 0), 1);
            timelineState.time = next * duration;
            timelineState.direction = 1;
            applyProgress(next, true);
          },
        };
        runtimeRef.current = runtime;

        renderer.toneMappingExposure = viewer.exposure ?? 1;
        controls.autoRotate = Boolean(viewer.autoRotate);
        controls.autoRotateSpeed = viewer.autoRotateSpeed ?? 0.6;
        fitCameraToObject(camera, controls, gltfRoot);
        applyProgress(0, true);

        setLoopMode(manifest.timeline.loop);
        setPlaying(runtime.playing);
        setStatus("ready");

        const render = () => {
          frameId = window.requestAnimationFrame(render);
          const delta = Math.min(clock.getDelta(), 0.05);
          if (!visible) return;

          if (runtime.playing) {
            const next = advanceTimeline(
              timelineState,
              delta,
              duration,
              manifest.timeline.loop,
              manifest.timeline.speed,
            );
            timelineState.time = next.time;
            timelineState.direction = next.direction;
            applyProgress(next.progress);
            if (next.ended) {
              runtime.playing = false;
              setPlaying(false);
            }
          }

          controls.update();
          renderer.render(scene, camera);
        };
        render();
      } catch (initialiseError) {
        if (cancelled) return;
        setError(initialiseError instanceof Error ? initialiseError.message : String(initialiseError));
        setStatus("error");
      }
    };

    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    visibilityObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) clock.getDelta();
    }, { rootMargin: "160px 0px" });
    visibilityObserver.observe(container);
    resize();
    initialise();

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
      resizeObserver?.disconnect();
      visibilityObserver?.disconnect();
      controls.dispose();
      dracoLoader.dispose();
      ktx2Loader.dispose();
      runtimeRef.current = null;
      pbrRuntime?.dispose();
      if (gltfRoot) {
        scene.remove(gltfRoot);
        disposeScene(gltfRoot);
      }
      environment.dispose();
      environmentBackground?.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [animationConfig, src]);

  const togglePlayback = () => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    if (!runtime.playing && runtime.manifest.timeline.loop === "once" && runtimeRef.current) {
      const progress = Number(progressInputRef.current?.value || 0);
      if (progress >= 1) runtime.setProgress(0);
    }
    runtime.playing = !runtime.playing;
    setPlaying(runtime.playing);
  };

  const seek = (event) => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.setProgress(Number(event.target.value));
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen();
      } else {
        await container.requestFullscreen();
      }
    } catch {
      // Browsers can reject fullscreen when the user gesture is interrupted.
    }
  };

  return (
    <div
      ref={containerRef}
      className={`pbr-model-viewer relative overflow-hidden ${className}`}
      style={{ backgroundColor: containerBackground }}
      aria-label={alt}
    >
      {poster && (
        <div
          className={`pointer-events-none absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-500 ${status === "ready" ? "opacity-0" : "opacity-100"}`}
          style={{ backgroundImage: `url(${publicAsset(poster)})` }}
          aria-hidden="true"
        />
      )}

      <canvas ref={canvasRef} className={`absolute inset-0 z-[1] h-full w-full transition-opacity duration-500 ${status === "ready" ? "opacity-100" : "opacity-0"}`} />

      {status === "loading" && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/20 text-xs font-semibold uppercase tracking-[0.14em] text-white backdrop-blur-[2px]">
          {locale === "ru" ? "Загрузка 3D" : "Loading 3D"}
        </div>
      )}

      {status === "error" && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-zinc-950/80 p-6 text-center text-sm text-white">
          <div>
            <p className="font-semibold">{locale === "ru" ? "Не удалось загрузить 3D-просмотр" : "Could not load the 3D viewer"}</p>
            <p className="mt-2 max-w-md text-white/60">{error}</p>
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="absolute inset-x-3 bottom-3 z-[2] flex items-center gap-3 rounded-full border border-white/20 bg-black/55 px-3 py-2 text-white backdrop-blur-md">
          <button
            type="button"
            onClick={togglePlayback}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-sm text-black"
            aria-label={playing ? (locale === "ru" ? "Пауза" : "Pause") : (locale === "ru" ? "Воспроизвести" : "Play")}
          >
            {playing ? "Ⅱ" : "▶"}
          </button>
          <input
            ref={progressInputRef}
            type="range"
            min="0"
            max="1"
            step="0.001"
            defaultValue="0"
            onInput={seek}
            className="min-w-0 flex-1 accent-orange-500"
            aria-label={locale === "ru" ? "Положение анимации" : "Animation progress"}
          />
          {fullscreenSupported && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 text-white transition-colors hover:bg-white/15"
              aria-label={fullscreen
                ? (locale === "ru" ? "Выйти из полноэкранного режима" : "Exit fullscreen")
                : (locale === "ru" ? "Открыть на весь экран" : "Open fullscreen")}
              title={fullscreen
                ? (locale === "ru" ? "Выйти из полноэкранного режима" : "Exit fullscreen")
                : (locale === "ru" ? "На весь экран" : "Fullscreen")}
            >
              <FullscreenIcon active={fullscreen} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
