import ProjectMedia from "../media/ProjectMedia";
import { getText, UI } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import { publicAsset } from "../../utils/publicAsset";
import "@google/model-viewer";

function BlockLabel({ children, light = false }) {
  return (
    <p
      className={`text-sm font-semibold uppercase tracking-[0.16em] ${
        light ? "text-white/45" : "text-zinc-500"
      }`}
    >
      {children}
    </p>
  );
}

function TextBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto grid max-w-[1600px] gap-10 px-5 py-16 md:grid-cols-[0.4fr_1.5fr] md:px-8 md:py-24">
      <BlockLabel>{getText(block.label, locale)}</BlockLabel>
      <div className="grid gap-8 text-xl leading-relaxed text-zinc-700 md:grid-cols-2">
        {block.columns?.map((column, index) => (
          <p key={index}>{getText(column, locale)}</p>
        ))}
      </div>
    </section>
  );
}

function MediaBlock({ block, project }) {
  const locale = useLocale();
  const sizeClass = block.size === "large" ? "min-h-[72vh]" : "min-h-[520px]";

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <ProjectMedia media={block.media} project={project} className={sizeClass} />
      {block.caption && (
        <p className="mt-3 text-sm text-zinc-500">{getText(block.caption, locale)}</p>
      )}
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

function Model3DBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-site">
        <div className="relative h-[560px] bg-site md:h-[680px]">
          <model-viewer
            src={publicAsset(block.src)}
            poster={publicAsset(block.poster)}
            alt={getText(block.alt, locale) || "3D model"}
            camera-controls
            autoplay
            auto-rotate
            rotation-per-second={block.rotationPerSecond || "24deg"}
            shadow-intensity={block.shadowIntensity ?? 0.8}
            exposure={block.exposure ?? 1}
            field-of-view={block.fieldOfView || "35deg"}
            environment-image={block.environmentImage || "neutral"}
            loading="lazy"
            reveal="auto"
            className="absolute inset-0 h-full w-full"
          />
        </div>
      </div>
      {block.caption && (
        <p className="mt-3 text-sm text-zinc-500">{getText(block.caption, locale)}</p>
      )}
    </section>
  );
}

function ProcessBlock({ block }) {
  const locale = useLocale();
  const ui = UI[locale];

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <h2 className="mobile-heading-lg mb-6 text-4xl font-black tracking-[-0.05em] md:text-7xl">
          {getText(block.title, locale) || ui.process}
        </h2>
        <div className="grid gap-6 text-zinc-700 md:grid-cols-3">
          {block.items?.map((item, index) => (
            <p key={index}>
              <strong className="text-zinc-950">
                {String(index + 1).padStart(2, "0")}. {getText(item.title, locale)}
              </strong>
              <br />
              {getText(item.text, locale)}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <blockquote className="mobile-heading-lg max-w-5xl text-4xl font-black leading-none tracking-[-0.06em] text-zinc-950 md:text-8xl">
        “{getText(block.text, locale)}”
      </blockquote>
    </section>
  );
}

function CreditsBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-3 rounded-[2rem] bg-zinc-950 p-6 text-white md:grid-cols-2 md:p-10">
        {block.items?.map((item, index) => (
          <div key={index} className="border-t border-white/15 pt-4">
            <BlockLabel light>{getText(item.label, locale)}</BlockLabel>
            <p className="mt-2 text-xl text-white/85">{getText(item.value, locale)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function CaseSummaryBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-10 rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10 lg:grid-cols-[0.75fr_1.25fr]">
        <div>
          <BlockLabel>{getText(block.label, locale)}</BlockLabel>
          <h2 className="mobile-heading-lg mt-5 text-4xl font-black leading-[0.95] tracking-[-0.05em] md:text-6xl">
            {getText(block.title, locale)}
          </h2>
          {block.intro && (
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-600">
              {getText(block.intro, locale)}
            </p>
          )}
        </div>
        <dl className="grid gap-px overflow-hidden rounded-[1.5rem] bg-zinc-950/10 sm:grid-cols-2">
          {block.items?.map((item, index) => (
            <div key={index} className="bg-site p-5 md:p-6">
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                {getText(item.label, locale)}
              </dt>
              <dd className="mt-3 leading-relaxed text-zinc-800">
                {getText(item.value, locale)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function ComparisonSide({ side, project, accent = false }) {
  const locale = useLocale();

  return (
    <div className={`rounded-[1.5rem] p-5 md:p-7 ${accent ? "bg-ink text-white" : "bg-site"}`}>
      {side.media && (
        <ProjectMedia
          media={side.media}
          project={project}
          className="mb-6 min-h-[320px]"
        />
      )}
      <h3 className="text-2xl font-black tracking-[-0.035em]">
        {getText(side.title, locale)}
      </h3>
      <p className={`mt-4 leading-relaxed ${accent ? "text-white/70" : "text-zinc-600"}`}>
        {getText(side.text, locale)}
      </p>
    </div>
  );
}

function ComparisonBlock({ block, project }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <BlockLabel>{getText(block.label, locale)}</BlockLabel>
      <h2 className="mobile-heading-lg mt-5 max-w-5xl text-4xl font-black tracking-[-0.05em] md:text-7xl">
        {getText(block.title, locale)}
      </h2>
      <div className="mt-10 grid gap-5 md:grid-cols-2">
        <ComparisonSide side={block.before || {}} project={project} />
        <ComparisonSide side={block.after || {}} project={project} accent />
      </div>
    </section>
  );
}

function PipelineBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] bg-zinc-950 p-6 text-white md:p-10">
        <BlockLabel light>{getText(block.label, locale)}</BlockLabel>
        <h2 className="mobile-heading-lg mt-5 max-w-5xl text-4xl font-black tracking-[-0.05em] md:text-7xl">
          {getText(block.title, locale)}
        </h2>
        <div className="mt-10 grid gap-px overflow-hidden rounded-[1.5rem] bg-white/15 md:grid-cols-5">
          {block.items?.map((item, index) => (
            <div key={index} className="relative bg-zinc-950 p-5">
              <p className="font-mono text-xs text-white/35">
                {String(index + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-6 font-bold">{getText(item.title, locale)}</h3>
              <p className="mt-3 text-sm leading-relaxed text-white/60">
                {getText(item.text, locale)}
              </p>
              {index < block.items.length - 1 && (
                <span className="absolute -bottom-3 right-5 z-10 text-accent md:-right-2 md:bottom-auto md:top-1/2">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
        {block.note && (
          <p className="mt-6 max-w-3xl border-l border-accent pl-4 text-sm leading-relaxed text-white/60">
            {getText(block.note, locale)}
          </p>
        )}
      </div>
    </section>
  );
}

function EvidenceColumn({ title, items, accent = false }) {
  const locale = useLocale();

  return (
    <div>
      <p
        className={`text-sm font-semibold uppercase tracking-[0.14em] ${
          accent ? "text-lime-700" : "text-zinc-500"
        }`}
      >
        {getText(title, locale)}
      </p>
      <ul className="mt-4 divide-y divide-zinc-950/10">
        {items?.map((item, index) => (
          <li key={index} className="py-4 leading-relaxed text-zinc-700">
            {getText(item, locale)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function EvidenceBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <BlockLabel>{getText(block.label, locale)}</BlockLabel>
        <h2 className="mobile-heading-lg mt-5 max-w-5xl text-4xl font-black tracking-[-0.05em] md:text-7xl">
          {getText(block.title, locale)}
        </h2>
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <EvidenceColumn
            title={block.confirmedTitle}
            items={block.confirmed}
            accent
          />
          <EvidenceColumn title={block.limitsTitle} items={block.limits} />
        </div>
      </div>
    </section>
  );
}

function FinalCtaBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] bg-accent p-6 md:p-10">
        <h2 className="mobile-heading-lg max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">
          {getText(block.title, locale)}
        </h2>
        <p className="mt-6 max-w-3xl text-lg leading-relaxed text-zinc-800">
          {getText(block.text, locale)}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          {block.primaryAction && (
            <a
              href={block.primaryAction.href}
              className="rounded-full bg-zinc-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white"
            >
              {getText(block.primaryAction.label, locale)}
            </a>
          )}
          {block.secondaryAction && (
            <a
              href={block.secondaryAction.href}
              className="rounded-full border border-zinc-950/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.08em]"
            >
              {getText(block.secondaryAction.label, locale)}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

export default function ProjectBlocks({ project }) {
  return project.blocks?.map((block, index) => {
    if (block.type === "text") return <TextBlock key={index} block={block} />;
    if (block.type === "media") {
      return <MediaBlock key={index} block={block} project={project} />;
    }
    if (block.type === "mediaGrid") {
      return <MediaGridBlock key={index} block={block} project={project} />;
    }
    if (block.type === "process") return <ProcessBlock key={index} block={block} />;
    if (block.type === "quote") return <QuoteBlock key={index} block={block} />;
    if (block.type === "credits") return <CreditsBlock key={index} block={block} />;
    if (block.type === "model3d") return <Model3DBlock key={index} block={block} />;
    if (block.type === "caseSummary") {
      return <CaseSummaryBlock key={index} block={block} />;
    }
    if (block.type === "comparison") {
      return <ComparisonBlock key={index} block={block} project={project} />;
    }
    if (block.type === "pipeline") return <PipelineBlock key={index} block={block} />;
    if (block.type === "evidence") return <EvidenceBlock key={index} block={block} />;
    if (block.type === "finalCta") return <FinalCtaBlock key={index} block={block} />;
    return null;
  });
}
