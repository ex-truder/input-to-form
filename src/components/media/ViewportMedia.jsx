import { useEffect, useRef, useState } from "react";
import PlaceholderVisual from "./PlaceholderVisual";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function ViewportMedia({ media, project, className = "min-h-[420px]" }) {
  const locale = useLocale();
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(media?.type !== "video");
  const [isVisible, setIsVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node || media?.type !== "video") return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldLoad(true);
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "320px 0px", threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [media?.type]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !shouldLoad) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (isVisible && !reduceMotion) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, [isVisible, shouldLoad]);

  if (!media || !media.src || failed) {
    return <PlaceholderVisual project={project} media={media} className={className} />;
  }

  if (media.type === "video") {
    return (
      <div
        ref={containerRef}
        className={`relative overflow-hidden rounded-[1.5rem] bg-zinc-900 ${className}`}
      >
        <video
          ref={videoRef}
          src={shouldLoad ? media.src : undefined}
          poster={media.poster}
          muted
          loop
          playsInline
          preload="none"
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[1.5rem] bg-zinc-200 ${className}`}>
      <img
        src={media.src}
        alt={getText(media.alt, locale) || getText(project?.title, locale) || "Project result"}
        loading="lazy"
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover"
      />
    </div>
  );
}
