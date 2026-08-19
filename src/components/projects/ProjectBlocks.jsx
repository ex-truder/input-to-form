import { useEffect, useMemo, useState } from "react";
import ProjectMedia from "../media/ProjectMedia";
import PbrAnimatedModel from "../media/PbrAnimatedModel";
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

  if (block.animationConfig) {
    return (
      <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
        <PbrAnimatedModel
          src={block.src}
          poster={block.poster}
          animationConfig={block.animationConfig}
          alt={getText(block.alt, locale)}
          className="h-[560px] rounded-[2rem] border border-zinc-950/10 md:h-[680px]"
        />
        {block.caption && (
          <p className="mt-3 text-sm text-zinc-500">{getText(block.caption, locale)}</p>
        )}
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-site">
        <div className="relative h-[560px] bg-site md:h-[680px]">
          <model-viewer
            src={publicAsset(block.src)}
            poster={publicAsset(block.poster)}
            alt={getText(block.alt, locale) || (locale === "ru" ? "3D-модель" : "3D model")}
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
          accent ? "text-orange-700" : "text-zinc-500"
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
              href={block.primaryAction.href.replace(":locale", locale)}
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

function CaseHeading({ block, light = false }) {
  const locale = useLocale();

  return (
    <div className="grid gap-5 md:grid-cols-[0.4fr_1.5fr] md:gap-10">
      <div className={`flex items-start gap-3 text-sm font-semibold uppercase tracking-[0.16em] ${light ? "text-white/45" : "text-zinc-500"}`}>
        {block.number && <span className={light ? "text-accent" : "text-zinc-950"}>{block.number}</span>}
        <span>{getText(block.label, locale)}</span>
      </div>
      <div>
        <h2 className={`max-w-5xl text-4xl font-black leading-[0.98] tracking-[-0.05em] md:text-7xl ${light ? "text-white" : "text-zinc-950"}`}>
          {getText(block.title, locale)}
        </h2>
        {block.intro && (
          <p className={`mt-6 max-w-3xl text-lg leading-relaxed ${light ? "text-white/60" : "text-zinc-600"}`}>
            {getText(block.intro, locale)}
          </p>
        )}
      </div>
    </div>
  );
}

function MediaSlot({ item, project, className = "aspect-[4/3] min-h-0" }) {
  const locale = useLocale();
  const isPlaceholder = !item.media || item.media.type === "placeholder" || !item.media.src;

  if (item.media?.type === "model3d" && item.media.src && item.media.animationConfig) {
    return (
      <PbrAnimatedModel
        src={item.media.src}
        poster={item.media.poster}
        animationConfig={item.media.animationConfig}
        alt={getText(item.media.alt, locale) || getText(item.title, locale)}
        className={className}
      />
    );
  }

  if (item.media?.type === "model3d" && item.media.src) {
    return (
      <div className={`relative overflow-hidden bg-site ${className}`}>
        <model-viewer
          src={publicAsset(item.media.src)}
          poster={publicAsset(item.media.poster)}
          alt={getText(item.media.alt, locale) || getText(item.title, locale) || (locale === "ru" ? "3D-модель" : "3D model")}
          camera-controls
          autoplay
          auto-rotate
          rotation-per-second={item.media.rotationPerSecond || "24deg"}
          shadow-intensity={item.media.shadowIntensity ?? 0.8}
          exposure={item.media.exposure ?? 1}
          field-of-view={item.media.fieldOfView || "35deg"}
          environment-image={item.media.environmentImage || "neutral"}
          loading="lazy"
          reveal="auto"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  }

  return (
    <div className="relative">
      <ProjectMedia media={item.media} project={project} className={className} />
      {isPlaceholder && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6 text-center">
          <span className="rounded-full border border-zinc-950/15 bg-[#f6f3ec]/75 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-600 backdrop-blur-sm">
            {getText(item.title, locale)} {locale === "ru" ? "медиа" : "media"}
          </span>
        </div>
      )}
    </div>
  );
}

function CaseSectionBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-28">
      <CaseHeading block={block} />
      <div className="mt-10 grid gap-8 text-lg leading-relaxed text-zinc-700 md:ml-[calc(21%+2.5rem)] md:grid-cols-2 md:text-xl">
        {block.paragraphs?.map((paragraph, index) => (
          <p key={index}>{getText(paragraph, locale)}</p>
        ))}
      </div>
    </section>
  );
}

function StageSystemBlock({ block, project }) {
  const locale = useLocale();
  const imageItems = useMemo(
    () => block.items?.filter((item) => item.media?.type === "image" && item.media.src) || [],
    [block.items],
  );
  const [activeIndex, setActiveIndex] = useState(null);
  const activeItem = activeIndex === null ? null : imageItems[activeIndex];

  useEffect(() => {
    if (!activeItem) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => (current - 1 + imageItems.length) % imageItems.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => (current + 1) % imageItems.length);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeItem, imageItems.length]);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-28">
        <CaseHeading block={block} />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {block.items?.map((item, index) => {
            const openIndex = imageItems.indexOf(item);
            const media = (
              <MediaSlot item={item} project={project} className="aspect-square min-h-0 rounded-[1rem]" />
            );

            return (
              <article key={index} className="overflow-hidden rounded-[1.5rem] border border-zinc-950/10 bg-white/35 p-3">
                {openIndex >= 0 ? (
                  <button
                    type="button"
                    onClick={() => setActiveIndex(openIndex)}
                    className="block w-full cursor-zoom-in text-left"
                    aria-label={`${locale === "ru" ? "Открыть в полном размере" : "View full size"}: ${getText(item.title, locale)}`}
                  >
                    {media}
                  </button>
                ) : media}
                <div className="flex items-end justify-between gap-4 px-2 pb-2 pt-5">
                  <div>
                    <p className="font-mono text-xs text-zinc-400">{String(index + 1).padStart(2, "0")}</p>
                    <h3 className="mt-2 text-xl font-black tracking-[-0.03em]">{getText(item.title, locale)}</h3>
                  </div>
                  <p className="max-w-28 text-right text-xs leading-relaxed text-zinc-500">{getText(item.note, locale)}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {activeItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-3 backdrop-blur-sm md:p-8"
          role="dialog"
          aria-modal="true"
          aria-label={getText(activeItem.title, locale)}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setActiveIndex(null);
          }}
        >
          <button
            type="button"
            onClick={() => setActiveIndex(null)}
            autoFocus
            className="absolute right-4 top-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/35 text-2xl text-white transition hover:bg-white hover:text-black md:right-8 md:top-8"
            aria-label={locale === "ru" ? "Закрыть" : "Close"}
          >
            ×
          </button>

          {imageItems.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex - 1 + imageItems.length) % imageItems.length)}
                className="absolute bottom-5 left-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/35 text-2xl text-white transition hover:bg-white hover:text-black md:bottom-auto md:left-8"
                aria-label={locale === "ru" ? "Предыдущее изображение" : "Previous image"}
              >
                ←
              </button>
              <button
                type="button"
                onClick={() => setActiveIndex((activeIndex + 1) % imageItems.length)}
                className="absolute bottom-5 right-4 z-10 flex h-12 w-12 items-center justify-center rounded-full border border-white/25 bg-black/35 text-2xl text-white transition hover:bg-white hover:text-black md:bottom-auto md:right-8"
                aria-label={locale === "ru" ? "Следующее изображение" : "Next image"}
              >
                →
              </button>
            </>
          )}

          <figure className="flex max-h-full max-w-full flex-col items-center gap-4">
            <img
              src={publicAsset(activeItem.media.src)}
              alt={getText(activeItem.media.alt, locale) || getText(activeItem.title, locale)}
              className="max-h-[calc(100vh-7rem)] max-w-full object-contain"
            />
            <figcaption className="text-center text-sm font-semibold text-white/75">
              {String(activeIndex + 1).padStart(2, "0")} / {String(imageItems.length).padStart(2, "0")} · {getText(activeItem.title, locale)}
            </figcaption>
          </figure>
        </div>
      )}
    </>
  );
}

function FormatSplitBlock({ block, project }) {
  const locale = useLocale();

  return (
    <section className="bg-zinc-950 py-16 text-white md:py-28">
      <div className="mx-auto max-w-[1600px] px-5 md:px-8">
        <CaseHeading block={block} light />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {block.items?.map((item, index) => (
            <article key={index} className="rounded-[1.5rem] border border-white/15 p-3">
              <MediaSlot item={item} project={project} className="aspect-video min-h-0 rounded-[1rem]" />
              <div className="p-3 pb-5 pt-6 md:p-5 md:pb-7">
                <p className="font-mono text-xs text-accent">0{index + 1}</p>
                <h3 className="mt-3 text-3xl font-black tracking-[-0.04em]">{getText(item.title, locale)}</h3>
                <p className="mt-4 max-w-xl leading-relaxed text-white/60">{getText(item.text, locale)}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BreakdownGridBlock({ block, project }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-28">
      <CaseHeading block={block} />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {block.items?.map((item, index) => (
          <article key={index}>
            <MediaSlot item={item} project={project} className="aspect-[4/3] min-h-0 rounded-[1.5rem]" />
            <div className="mt-4 flex items-center justify-between border-t border-zinc-950/10 pt-3">
              <h3 className="font-semibold">{getText(item.title, locale)}</h3>
              <span className="font-mono text-xs text-zinc-400">{String(index + 1).padStart(2, "0")}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function OutcomeBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-28">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <CaseHeading block={block} />
        <div className="mt-10 grid gap-8 md:ml-[calc(21%+2.5rem)] md:grid-cols-[1.4fr_0.6fr]">
          <p className="text-xl leading-relaxed text-zinc-700 md:text-2xl">{getText(block.text, locale)}</p>
          {block.note && (
            <p className="border-l border-zinc-950/15 pl-4 text-sm leading-relaxed text-zinc-500">{getText(block.note, locale)}</p>
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
    if (block.type === "caseSection") return <CaseSectionBlock key={index} block={block} />;
    if (block.type === "stageSystem") return <StageSystemBlock key={index} block={block} project={project} />;
    if (block.type === "formatSplit") return <FormatSplitBlock key={index} block={block} project={project} />;
    if (block.type === "breakdownGrid") return <BreakdownGridBlock key={index} block={block} project={project} />;
    if (block.type === "outcome") return <OutcomeBlock key={index} block={block} />;
    if (block.type === "finalCta") return <FinalCtaBlock key={index} block={block} />;
    return null;
  });
}
