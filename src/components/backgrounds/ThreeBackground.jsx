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
    const clickPointer = new THREE.Vector2();
    const lastClientPosition = new THREE.Vector2();
    let hasPointerPosition = false;
    let pointerActive = false;
    let clickSequence = 0;
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

    const updatePointer = () => {
      if (!hasPointerPosition) {
        pointerActive = false;
        return;
      }

      const rect = mount.getBoundingClientRect();
      pointerActive =
        lastClientPosition.x >= rect.left &&
        lastClientPosition.x <= rect.right &&
        lastClientPosition.y >= rect.top &&
        lastClientPosition.y <= rect.bottom;

      if (!pointerActive) return;
      pointer.x = ((lastClientPosition.x - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((lastClientPosition.y - rect.top) / rect.height) * 2 + 1;
    };

    const onPointerMove = (event) => {
      if (event.pointerType === "touch") return;
      hasPointerPosition = true;
      lastClientPosition.set(event.clientX, event.clientY);
      updatePointer();
    };

    const onPointerDown = (event) => {
      lastClientPosition.set(event.clientX, event.clientY);
      hasPointerPosition = event.pointerType !== "touch";
      updatePointer();

      const rect = mount.getBoundingClientRect();
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      if (!inside) return;

      clickPointer.set(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1,
      );
      clickSequence += 1;
    };

    const clearPointer = () => {
      hasPointerPosition = false;
      pointerActive = false;
    };

    const clock = new THREE.Clock();
    const render = () => {
      frameId = window.requestAnimationFrame(render);
      if (!visible || !sceneController) return;

      const delta = Math.min(clock.getDelta(), 0.05);
      elapsed += delta;
      const progress = getScrollProgress();
      if (interactive) updatePointer();

      sceneController.update({
        elapsed,
        delta,
        progress,
        pointer,
        interaction: {
          active: pointerActive,
          clickPointer,
          clickSequence,
        },
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
    if (interactive) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("pointerup", onPointerDown, { capture: true, passive: true });
      window.addEventListener("blur", clearPointer);
      document.documentElement.addEventListener("mouseleave", clearPointer);
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
      window.removeEventListener("pointerup", onPointerDown, { capture: true });
      window.removeEventListener("blur", clearPointer);
      document.documentElement.removeEventListener("mouseleave", clearPointer);
      sceneController?.dispose?.();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [interactive, intensity, sceneName, sceneProps, scrollDriven]);

  return <div ref={mountRef} className="absolute inset-0 [&_canvas]:h-full [&_canvas]:w-full" />;
}
