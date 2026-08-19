import { useState } from "react";
import PlaceholderVisual from "./PlaceholderVisual";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import { publicAsset } from "../../utils/publicAsset";

export default function ProjectMedia({ media, project, className = "min-h-[420px]", priority = false }) {
  const locale = useLocale();
  const [failed, setFailed] = useState(false);
  const src = publicAsset(media?.src);
  const poster = publicAsset(media?.poster);

  if (!media || media.type === "placeholder" || !media.src || failed) {
    return <PlaceholderVisual project={project} media={media} className={className} />;
  }

  if (media.type === "video") {
    return (
      <div className={`relative overflow-hidden rounded-[1rem] bg-zinc-200 ${className}`}>
        <video
          src={src}
          poster={poster}
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
        src={src}
        alt={getText(media.alt, locale) || getText(project?.title, locale) || (locale === "ru" ? "Медиа проекта" : "Project media")}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}
