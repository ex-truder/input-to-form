import { useEffect, useRef, useState } from "react";
import ThreeBackground from "./ThreeBackground";
import { publicAsset } from "../../utils/publicAsset";

const overlayClasses = {
  dark: "bg-gradient-to-r from-black/75 via-black/45 to-black/10",
  light: "bg-gradient-to-r from-site/90 via-site/60 to-site/10",
  soft: "bg-white/25",
  none: "",
};

function VideoBackground({ background }) {
  const videoRef = useRef(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setShouldLoad(true);
        setIsVisible(entry.isIntersecting);
      },
      { rootMargin: "320px 0px", threshold: 0.05 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, []);

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

  if (failed) return null;

  return (
    <video
      ref={videoRef}
      src={shouldLoad ? publicAsset(background.src) : undefined}
      poster={publicAsset(background.poster)}
      muted
      loop
      playsInline
      preload="none"
      onError={() => setFailed(true)}
      className="absolute inset-0 h-full w-full object-cover"
      style={{ objectPosition: background.position || "center" }}
      aria-hidden="true"
    />
  );
}

export default function SectionBackground({ background }) {
  if (!background || background.type === "none") return null;

  const posterStyle = background.poster
    ? {
        backgroundImage: `url("${publicAsset(background.poster)}")`,
        backgroundPosition: background.position || "center",
        backgroundSize: "cover",
      }
    : undefined;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      style={{ ...posterStyle, opacity: background.opacity ?? 1 }}
      aria-hidden="true"
    >
      {background.type === "video" && <VideoBackground background={background} />}
      {background.type === "three" && (
        <ThreeBackground
          sceneName={background.scene}
          sceneProps={background.sceneProps}
          scrollDriven={background.scrollDriven}
          interactive={background.interactive}
          intensity={background.intensity}
        />
      )}
      <div
        className={`absolute inset-0 ${overlayClasses[background.overlay || "none"]}`}
      />
    </div>
  );
}
