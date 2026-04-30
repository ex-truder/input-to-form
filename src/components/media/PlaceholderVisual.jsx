import Shape from "./Shape";

export default function PlaceholderVisual({ project, media, className = "min-h-[420px]" }) {
  const shape = media?.shape || project?.shape || "orb";
  const accent = media?.accent || project?.accent || "from-neutral-100 via-neutral-300 to-neutral-500";

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${accent} ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.65),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(0,0,0,0.14),transparent_30%)]" />
      <Shape kind={shape} />
    </div>
  );
}