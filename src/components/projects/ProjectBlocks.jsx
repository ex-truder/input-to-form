import ProjectMedia from "../media/ProjectMedia";

function TextBlock({ block }) {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-10 px-5 py-16 md:grid-cols-[0.65fr_1.35fr] md:px-8 md:py-24">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">{block.label || "Project note"}</p>
      </div>
      <div className="grid gap-8 text-xl leading-relaxed text-zinc-700 md:grid-cols-2">
        {block.columns?.map((column, index) => (
          <p key={index}>{column}</p>
        ))}
      </div>
    </section>
  );
}

function MediaBlock({ block, project }) {
  const sizeClass = block.size === "large" ? "min-h-[72vh]" : "min-h-[520px]";

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <ProjectMedia media={block.media} project={project} className={sizeClass} />
      {block.caption && <p className="mt-3 text-sm text-zinc-500">{block.caption}</p>}
    </section>
  );
}

function MediaGridBlock({ block, project }) {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-5 px-5 py-5 md:grid-cols-2 md:px-8">
      {block.items?.map((item, index) => (
        <ProjectMedia key={index} media={item} project={project} className="min-h-[520px]" />
      ))}
    </section>
  );
}

function ProcessBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <h2 className="mb-6 text-4xl font-black tracking-[-0.05em] md:text-7xl">Process</h2>
        <div className="grid gap-6 text-zinc-700 md:grid-cols-3">
          {block.items?.map((item, index) => (
            <p key={item.title}>
              <strong className="text-zinc-950">{String(index + 1).padStart(2, "0")}. {item.title}</strong>
              <br />
              {item.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <blockquote className="max-w-5xl text-4xl font-black leading-none tracking-[-0.06em] text-zinc-950 md:text-8xl">
        “{block.text}”
      </blockquote>
    </section>
  );
}

function CreditsBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-3 rounded-[2rem] bg-zinc-950 p-6 text-white md:grid-cols-2 md:p-10">
        {block.items?.map((item) => (
          <div key={item.label} className="border-t border-white/15 pt-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/40">{item.label}</p>
            <p className="text-xl text-white/85">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function ProjectBlocks({ project }) {
  return project.blocks?.map((block, index) => {
    if (block.type === "text") return <TextBlock key={index} block={block} />;
    if (block.type === "media") return <MediaBlock key={index} block={block} project={project} />;
    if (block.type === "mediaGrid") return <MediaGridBlock key={index} block={block} project={project} />;
    if (block.type === "process") return <ProcessBlock key={index} block={block} />;
    if (block.type === "quote") return <QuoteBlock key={index} block={block} />;
    if (block.type === "credits") return <CreditsBlock key={index} block={block} />;
    return null;
  });
}
