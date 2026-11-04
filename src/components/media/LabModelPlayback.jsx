import { useEffect, useRef, useState } from "react";
import { advanceTimeline } from "./pbrAnimation";
import { createSpineTextureBlend } from "./spineTextureBlend";

export default function LabModelPlayback({ viewerRef, spine, locale, onMaterialsReady }) {
  const ru = locale === "ru";
  const runtime = useRef(null);
  const [status, setStatus] = useState(spine ? "loading" : "ready");
  const [playing, setPlaying] = useState(!spine);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const viewer = viewerRef.current;
    const controller = new AbortController();
    let materials;
    let timer;
    let exporting = false;
    const onExportStart = () => { exporting = true; };
    const onExportEnd = () => { exporting = false; };
    viewer.addEventListener("lab-export-start", onExportStart);
    viewer.addEventListener("lab-export-end", onExportEnd);
    let lastTime = performance.now();
    let timeline = { time: 0, direction: 1 };
    const apply = value => {
      viewer.currentTime = value * materials.duration;
      materials.update(value);
      setProgress(value);
    };
    if (spine) {
      createSpineTextureBlend(viewer, controller.signal).then(result => {
        if (controller.signal.aborted) { result.dispose(); return; }
        materials = result;
        viewer.pause();
        apply(0);
        runtime.current = {
          playing: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
          seek(value) { timeline = { time: value * materials.duration, direction: 1 }; apply(value); },
        };
        setPlaying(runtime.current.playing);
        setStatus("ready");
        onMaterialsReady(true);
        // Window rAF can stop during immersive WebXR. A modest timer keeps the
        // model-viewer scene and its exported canvas maps synchronized in XR too.
        timer = window.setInterval(() => {
          const now = performance.now();
          const delta = Math.min((now - lastTime) / 1000, 0.1);
          lastTime = now;
          if (!runtime.current?.playing || document.hidden || exporting) return;
          timeline = advanceTimeline(timeline, delta, materials.duration, "ping-pong");
          apply(timeline.progress);
        }, 50);
      }).catch(error => {
        if (error.name !== "AbortError") { setStatus("error"); onMaterialsReady(false); }
      });
    }
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    if (!spine) {
      viewer.addEventListener("play", onPlay);
      viewer.addEventListener("pause", onPause);
    }
    return () => {
      controller.abort();
      window.clearInterval(timer);
      materials?.dispose();
      runtime.current = null;
      viewer.removeEventListener("play", onPlay);
      viewer.removeEventListener("pause", onPause);
      viewer.removeEventListener("lab-export-start", onExportStart);
      viewer.removeEventListener("lab-export-end", onExportEnd);
    };
  }, [viewerRef, spine, onMaterialsReady]);

  function toggle() {
    const viewer = viewerRef.current;
    if (spine) { runtime.current.playing = !runtime.current.playing; setPlaying(runtime.current.playing); }
    else if (viewer.paused) viewer.play();
    else viewer.pause();
  }

  if (status === "loading") return <p role="status">{ru ? "Загружаем текстуры перехода…" : "Loading transition textures…"}</p>;
  if (status === "error") return <p role="alert">{ru ? "Не удалось загрузить текстуры. Повторите загрузку модели." : "Could not load textures. Reload the model to try again."}</p>;
  return (
    <div className="lab-ar__playback">
      <button type="button" className="lab-ar__secondary" onClick={toggle}>
        {playing ? (ru ? "Пауза" : "Pause") : (ru ? "Воспроизвести" : "Play")}
      </button>
      {spine && <label className="lab-ar__timeline">
        <span>{ru ? "Развитие изменений" : "Progression"} · {Math.round(progress * 100)}%</span>
        <input type="range" min="0" max="1" step="0.001" value={progress}
          onChange={event => {
            runtime.current.playing = false;
            setPlaying(false);
            runtime.current.seek(Number(event.target.value));
          }} />
      </label>}
      {spine && <p className="text-sm leading-relaxed text-body">
        {ru ? "Переход текстур воспроизводится здесь и в WebXR. Кнопка ниже экспортирует текущую стадию для Quick Look. Отдельный HQ-файл для iPhone анимирует форму с фиксированными текстурами. Scene Viewer загружает исходный GLB без этих изменений."
          : "Texture transitions play here and in WebXR. The button below exports the current stage for Quick Look. The separate HQ file for iPhone animates the shape with fixed textures. Scene Viewer loads the original GLB without these changes."}
      </p>}
    </div>
  );
}
