import { useState } from "react";
import PlaceholderVisual from "./PlaceholderVisual";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function ProjectMedia({ media, project, className = "min-h-[420px]", priority = false }) {
  const locale = useLocale();
  const [failed, setFailed] = useState(false);

  if (!media || media.type === "placeholder" || !media.src || failed) {
    return <PlaceholderVisual project={project} media={media} className={className} />;
  }

  if (media.type === "video") {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] bg-zinc-200 ${className}`}>
        <video
          src={media.src}
          poster={media.poster}
          autoPlay={media.autoPlay ?? true}
          muted={media.muted ?? true}
          loop={media.loop ?? true}
          playsInline
          controls={media.controls ?? false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-zinc-200 ${className}`}>
      <img
        src={media.src}
        alt={getText(media.alt, locale) || getText(project?.title, locale) || "Project media"}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}