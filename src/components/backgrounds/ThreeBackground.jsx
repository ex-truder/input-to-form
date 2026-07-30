import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  DEFAULT_THREE_SCENE,
  loadThreeScene,
} from "./scenes";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const EMPTY_SCENE_PROPS = {};

export default function ThreeBackground({
  sceneName = DEFAULT_THREE_SCENE,
  sceneProps = EMPTY_SCENE_PROPS,
  scrollDriven = true,
  interactive = true,
  intensity = 1,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
    camera.position.set(0, 0, 6);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      return undefined;
    }

    renderer.setClearColor(0x000000, 0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    const pointer = new THREE.Vector2();
    let visible = true;
    let frameId;
    let elapsed = 0;
    let sceneController;
    let disposed = false;

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (!width || !height) return;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      sceneController?.resize?.({
        width,
        height,
        aspect: camera.aspect,
        pixelRatio: renderer.getPixelRatio(),
      });
    };

    const getScrollProgress = () => {
      if (!scrollDriven) return 0.5;
      const section = mount.parentElement;
      if (!section) return 0.5;
      const rect = section.getBoundingClientRect();
      return clamp(
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
        0,
        1,
      );
    };

    const onPointerMove = (event) => {
      pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    const clock = new THREE.Clock();
    const render = () => {
      frameId = window.requestAnimationFrame(render);
      if (!visible || !sceneController) return;

      const delta = reduceMotion ? 0 : Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      const progress = getScrollProgress();

      sceneController.update({
        elapsed,
        delta,
        progress,
        pointer,
        intensity,
        reducedMotion: reduceMotion,
      });
      renderer.render(scene, camera);
    };

    const visibilityObserver = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { rootMargin: "160px 0px" },
    );
    const resizeObserver = new ResizeObserver(resize);

    visibilityObserver.observe(mount);
    resizeObserver.observe(mount);
    if (interactive && !reduceMotion) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
    }

    resize();
    render();
    loadThreeScene(sceneName)
      .then((createScene) => {
        if (disposed) return;
        sceneController = createScene({
          THREE,
          scene,
          camera,
          renderer,
          config: sceneProps,
        });
        resize();
      })
      .catch(() => {
        if (!disposed) mount.dataset.sceneError = sceneName;
      });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      sceneController?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [interactive, intensity, sceneName, sceneProps, scrollDriven]);

  return <div ref={mountRef} className="absolute inset-0 [&_canvas]:h-full [&_canvas]:w-full" />;
}
