import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { publicAsset } from "../../utils/publicAsset";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import HdaParameterPanel from "./HdaParameterPanel";
import { mapVideoTime, prepareHdaBundle, resolveNode, sampleAtTime } from "./hdaPlayback";
import { createVideoClock } from "./hdaVideoClock";
import "./hda.css";

function PanelList({ panels, bundle, sampleIndex }) {
  return panels.map((panel, index) => <HdaParameterPanel key={panel.id ?? index} bundle={bundle} panel={panel} sampleIndex={sampleIndex} />);
}

function overlayStyle(panel) {
  const style = { width: panel.width ?? 320 };
  if (panel.x != null || panel.y != null) {
    style.left = typeof panel.x === "number" ? `${panel.x}%` : panel.x ?? "1rem";
    style.top = typeof panel.y === "number" ? `${panel.y}%` : panel.y ?? "1rem";
  } else {
    const [vertical, horizontal] = (panel.anchor || "top-right").split("-");
    style[vertical === "bottom" ? "bottom" : "top"] = "1.25rem";
    style[horizontal === "left" ? "left" : "right"] = "1.25rem";
  }
  return style;
}

function HdaDemoPlayer({ bundle, video, panels, sync, time = 0, showTime = false, className = "", emptyMedia }) {
  const locale = useLocale();
  const [element, setElement] = useState(null);
  const [failedSrc, setFailedSrc] = useState(null);
  const clock = useMemo(() => createVideoClock(element), [element]);
  const videoTime = useSyncExternalStore(clock.subscribe, clock.getSnapshot, clock.getServerSnapshot);
  const selectedPanels = panels ?? bundle.parameters.nodes.map((node) => ({ node: node.id, placement: "right" }));
  // Configuration mistakes are visible and recoverable, rather than crashing the page.
  let configurationError = null;
  let sourceTime = null;
  try {
    sourceTime = mapVideoTime(video?.src ? videoTime : time, sync);
    selectedPanels.forEach((panel) => {
      resolveNode(bundle, panel.node);
      if (!["left", "right", "below", "overlay"].includes(panel.placement ?? "right")) throw new Error(`Unknown panel placement: ${panel.placement}`);
    });
  } catch (error) {
    configurationError = error.message;
  }
  if (configurationError) return <div className="hda-load-state" role="alert">{configurationError}</div>;
  const index = sampleAtTime(bundle, sourceTime);
  const byPlacement = (placement) => selectedPanels.filter((panel) => (panel.placement ?? "right") === placement);
  const left = byPlacement("left");
  const right = byPlacement("right");
  const below = byPlacement("below");
  const overlays = byPlacement("overlay");
  const src = publicAsset(video?.src);
  const failed = src && failedSrc === src;
  return (
    <div className={`hda-demo ${className}`} style={{ "--hda-left-width": left[0]?.width ? `${left[0].width}px` : "320px",
      "--hda-right-width": right[0]?.width ? `${right[0].width}px` : "320px" }}>
      <div className={`hda-composition ${left.length ? "has-left" : ""} ${right.length ? "has-right" : ""}`}>
        {left.length > 0 && <aside className="hda-side hda-side-left"><PanelList panels={left} bundle={bundle} sampleIndex={index} /></aside>}
        <div className="hda-stage">
          {src && !failed ? <video ref={setElement} src={src} poster={publicAsset(video.poster)}
            controls={video.controls ?? true} autoPlay={video.autoPlay ?? false} muted={video.muted ?? true}
            loop={video.loop ?? true} playsInline preload="metadata" aria-label={getText(video.alt, locale) || "HDA demo"}
            onError={() => setFailedSrc(src)} style={{ objectFit: video.fit ?? "contain" }} />
            : <div className="hda-empty-media">{emptyMedia ?? (locale === "ru" ? "Видео недоступно" : "Video unavailable")}</div>}
          {index >= 0 && overlays.map((panel, i) => <div className="hda-overlay" style={overlayStyle(panel)} key={panel.id ?? i}>
            <HdaParameterPanel bundle={bundle} panel={panel} sampleIndex={index} />
          </div>)}
        </div>
        {right.length > 0 && <aside className="hda-side hda-side-right"><PanelList panels={right} bundle={bundle} sampleIndex={index} /></aside>}
      </div>
      {below.length > 0 && <div className="hda-below"><PanelList panels={below} bundle={bundle} sampleIndex={index} /></div>}
      {showTime && <div className="hda-time-readout"><span>{sourceTime == null ? "—" : `${sourceTime.toFixed(3)} s`}</span>
        <span>{index >= 0 ? `${locale === "ru" ? "Кадр" : "Frame"} ${bundle.animation.sampleFrames[index]}` : "—"}</span></div>}
    </div>
  );
}

function HdaDemoLoader({ parameters, animation, ...props }) {
  const locale = useLocale();
  const [loaded, setLoaded] = useState(null);
  const key = `${parameters}|${animation}`;
  useEffect(() => {
    const controller = new AbortController();
    const load = async (path) => {
      if (!path) throw new Error("Both parameters and animation URLs are required.");
      const response = await fetch(publicAsset(path), { signal: controller.signal });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
      return response.json();
    };
    Promise.all([load(parameters), load(animation)])
      .then(([description, motion]) => prepareHdaBundle(description, motion))
      .then((bundle) => { if (!controller.signal.aborted) setLoaded({ key, bundle }); })
      .catch((error) => {
        if (controller.signal.aborted) return;
        console.error("HDA demo:", error);
        setLoaded({ key, error: error.message });
      });
    return () => controller.abort();
  }, [parameters, animation, key]);
  if (loaded?.key !== key) return <div className="hda-load-state" role="status">{locale === "ru" ? "Загрузка демонстрации…" : "Loading demo…"}</div>;
  if (loaded.error) return <div className="hda-load-state" role="alert">{locale === "ru" ? "Демонстрация параметров временно недоступна." : "The parameter demo is temporarily unavailable."}</div>;
  return <HdaDemoPlayer key={key} bundle={loaded.bundle} {...props} />;
}

export default function HdaDemo({ bundle, ...props }) {
  return bundle ? <HdaDemoPlayer bundle={bundle} {...props} /> : <HdaDemoLoader {...props} />;
}
