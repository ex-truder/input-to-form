import { useEffect, useRef, useState } from "react";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import { publicAsset } from "../../utils/publicAsset";
import "./arthritis.css";

export function ArthritisBackdrop() {
  const backdropRef = useRef(null);

  useEffect(() => {
    const backdrop = backdropRef.current;
    if (!backdrop) return undefined;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame;
    const update = () => {
      frame = undefined;
      if (motion.matches) {
        backdrop.style.setProperty("--skeleton-drift", "0px");
        return;
      }
      const rect = backdrop.getBoundingClientRect();
      const scrollRange = Math.max(1, rect.height - window.innerHeight);
      const progress = Math.min(1, Math.max(0, -rect.top / scrollRange));
      // Reveal the oversized skeleton from head to feet across the case.
      // The background covers 2.2 viewports while the content travels the full page.
      backdrop.style.setProperty("--skeleton-drift", `${-progress * window.innerHeight * 2.2}px`);
    };
    const schedule = () => {
      if (frame === undefined) frame = window.requestAnimationFrame(update);
    };
    const configure = () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (!motion.matches) {
        window.addEventListener("scroll", schedule, { passive: true });
        window.addEventListener("resize", schedule);
      }
      schedule();
    };
    configure();
    motion.addEventListener("change", configure);
    return () => {
      if (frame !== undefined) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      motion.removeEventListener("change", configure);
    };
  }, []);

  return <div ref={backdropRef} className="arthritis-backdrop" aria-hidden="true">
    <div className="arthritis-backdrop-viewport">
      <img src={publicAsset("/projects/arthritis/skeleton_background.webp")} alt="" width="982" height="1800" decoding="async" />
    </div>
  </div>;
}

export function ArthritisAnatomy({ items }) {
  const locale = useLocale();
  const [selectedId, setSelectedId] = useState(items[0].id);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];
  const title = getText(selected.title, locale);
  const states = [
    { key: "healthy", label: locale === "ru" ? "Исходное состояние" : "Baseline" },
    { key: "damaged", label: locale === "ru" ? "Изменения при артрите" : "Arthritic changes" },
  ];

  return <div className="arthritis-anatomy mt-10 md:mt-12">
    <div className="anatomy-regions" role="group" aria-label={locale === "ru" ? "Область сравнения" : "Comparison region"}>
      {items.map((item) => <button key={item.id} type="button" aria-pressed={selected.id === item.id}
        aria-controls="anatomy-comparison" onClick={() => setSelectedId(item.id)}>
        {getText(item.title, locale)}
      </button>)}
    </div>
    <div id="anatomy-comparison" className="anatomy-comparison" role="region" aria-label={title}>
      <h3 className="anatomy-region-title" aria-live="polite" aria-atomic="true">{title}</h3>
      {states.map((state) => <figure key={state.key}>
        <img key={selected[state.key]} src={publicAsset(selected[state.key])}
          alt={`${title}: ${state.label}`} width="1100" height="1100" loading="lazy" decoding="async" />
        <figcaption>{state.label}</figcaption>
      </figure>)}
    </div>
  </div>;
}

export function OsteophyteProcess({ items }) {
  const locale = useLocale();
  return <ol className="osteophyte-process mt-10 md:mt-12">
    {items.map((item, index) => <li key={index}>
      <div className="osteophyte-media">
        {item.images.map((image) => <figure key={image.src}>
          <img src={publicAsset(image.src)} alt={getText(image.label, locale)} loading="lazy" decoding="async" />
          <figcaption>{getText(image.label, locale)}</figcaption>
        </figure>)}
      </div>
      <h3><span className="osteophyte-step">{index + 1}.</span> {getText(item.title, locale)}</h3>
      <p>{getText(item.text, locale)}</p>
    </li>)}
  </ol>;
}
