import { Link } from "react-router-dom";
import { site } from "../data/site";
import { projects } from "../data/projects";
import { homeContent } from "../data/home";
import ViewportMedia from "../components/media/ViewportMedia";
import Reveal from "../components/motion/Reveal";
import SectionBackground from "../components/backgrounds/SectionBackground";
import { getText } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";

function DirectionCase({ direction }) {
  const locale = useLocale();
  const item = direction.case;
  const project = projects.find((candidate) => candidate.slug === item.slug);
  const media = item.media || project?.cover;
  const mediaProject = project || {
    title: item.title,
    accent: "from-orange-100 via-orange-300 to-amber-200",
    shape: "orb",
  };
  const isDark = direction.id === "explain";

  const card = (
    <article className={`group overflow-hidden rounded-[2rem] border ${
      isDark ? "border-white/15 bg-white/5" : "border-zinc-950/10 bg-surface"
    }`}>
      <div className="grid lg:grid-cols-[1.12fr_0.88fr]">
        <Reveal variant="scale-in">
          <ViewportMedia
            media={media}
            project={mediaProject}
            className="aspect-[4/3] min-h-0 rounded-none lg:aspect-auto lg:min-h-[500px]"
          />
        </Reveal>
        <div className="flex flex-col justify-between gap-10 p-6 md:p-9">
          <div>
            <p className={`text-xs font-semibold uppercase tracking-[0.16em] ${isDark ? "text-accent" : "text-zinc-500"}`}>
              {getText(item.label, locale)}
            </p>
            <h3 className="mobile-heading-lg mt-5 text-3xl font-black leading-[0.98] tracking-[-0.045em] md:text-5xl">
              {getText(item.title, locale)}
            </h3>
            <p className={`mt-6 max-w-xl text-lg leading-relaxed ${isDark ? "text-white/65" : "text-zinc-600"}`}>
              {getText(item.summary, locale)}
            </p>
          </div>
          <div className={`border-t pt-5 ${isDark ? "border-white/15" : "border-zinc-950/10"}`}>
            <p className={`font-mono text-sm ${isDark ? "text-white/65" : "text-zinc-700"}`}>
              {getText(item.logic, locale)}
            </p>
            {item.action && (
              <p className={`mt-6 text-sm font-semibold uppercase tracking-[0.1em] ${isDark ? "text-accent" : "text-zinc-950"}`}>
                {getText(item.action, locale)} <span aria-hidden="true">↗</span>
              </p>
            )}
            {item.status && (
              <p className="mt-6 inline-flex rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-ink">
                {getText(item.status, locale)}
              </p>
            )}
          </div>
        </div>
      </div>
    </article>
  );

  if (!project) return card;

  return (
    <Link to={`/${locale}/work/${project.slug}`} className="block transition-transform duration-300 hover:-translate-y-1">
      {card}
    </Link>
  );
}

function DirectionSection({ direction }) {
  const locale = useLocale();
  const isDark = direction.id === "explain";
  const isAccent = direction.id === "save-time";

  return (
    <section
      id={direction.id}
      className={`scroll-mt-24 border-t ${
        isDark
          ? "border-white/10 bg-ink text-white"
          : isAccent
            ? "border-zinc-950/10 bg-accent-soft text-ink"
            : "border-zinc-950/10 bg-site text-ink"
      }`}
    >
      <div className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-28">
        <div className="mb-12 grid gap-7 md:grid-cols-[0.35fr_1fr]">
          <p className={`font-mono text-sm ${isDark ? "text-accent" : "text-zinc-500"}`}>{direction.number}</p>
          <div>
            <Reveal variant="mask-up">
              <h2 className="mobile-heading-xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-8xl">
                {getText(direction.title, locale)}
              </h2>
            </Reveal>
            <Reveal variant="fade-up" delay={90}>
              <p className="mt-6 max-w-4xl text-2xl font-semibold leading-tight md:text-4xl">
                {getText(direction.statement, locale)}
              </p>
              <p className={`mt-5 max-w-2xl text-lg leading-relaxed ${isDark ? "text-white/60" : "text-zinc-600"}`}>
                {getText(direction.text, locale)}
              </p>
            </Reveal>
          </div>
        </div>
        <DirectionCase direction={direction} />
      </div>
    </section>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const content = homeContent;
  const emailSubject = locale === "ru" ? "Задача на визуальный контент" : "Visual content project";

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <SectionBackground background={content.hero.background} />
        <div className="relative z-10 mx-auto max-w-[1600px] px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">
            {getText(content.hero.eyebrow, locale)}
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
            <Reveal variant="mask-up">
              <h1 className="mobile-heading-xl max-w-6xl text-[12vw] font-black uppercase leading-[0.86] tracking-[-0.07em] md:text-[7vw] lg:text-[6vw]">
                {getText(content.hero.title, locale)}
              </h1>
            </Reveal>
            <Reveal variant="fade-up" delay={120} className="max-w-xl lg:justify-self-end">
              <div>
            <p className="text-balance text-xl leading-relaxed text-zinc-700 md:text-2xl">
              {getText(content.hero.text, locale)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(emailSubject)}`}
                className="rounded-full bg-ink px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-zinc-700"
              >
                {getText(content.hero.primaryAction, locale)}
              </a>
              <a
                href="#directions"
                className="rounded-full border border-zinc-950/20 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] transition hover:border-accent hover:text-accent"
              >
                {getText(content.hero.secondaryAction, locale)}
              </a>
            </div>
              </div>
            </Reveal>
          </div>
          <div id="directions" className="mt-16 grid border-y border-zinc-950/10 md:grid-cols-3">
            {content.directions.items.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-center justify-between border-b border-zinc-950/10 py-5 text-lg font-black uppercase tracking-[-0.02em] last:border-b-0 md:border-b-0 md:border-r md:px-6 md:first:pl-0 md:last:border-r-0"
              >
                {getText(item.title, locale)}
                <span className="text-accent transition-transform group-hover:translate-y-1">↓</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {content.directions.items.map((direction) => (
        <DirectionSection key={direction.id} direction={direction} />
      ))}

      <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-10 md:grid-cols-[0.35fr_1fr]">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {getText(content.process.eyebrow, locale)}
          </p>
          <div>
            <h2 className="mobile-heading-lg max-w-4xl text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">
              {getText(content.process.title, locale)}
            </h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-zinc-950/10 md:grid-cols-3">
              {content.process.items.map((item, index) => (
                <Reveal key={index} variant="fade-up" delay={index * 90} className="bg-surface p-6 md:p-8">
                  <p className="font-mono text-sm text-accent">0{index + 1}</p>
                  <h3 className="mt-8 text-2xl font-black tracking-[-0.035em]">{getText(item.title, locale)}</h3>
                  <p className="mt-4 leading-relaxed text-zinc-600">{getText(item.text, locale)}</p>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-zinc-950/10 bg-accent">
        <div className="mx-auto grid max-w-[1600px] gap-8 px-5 py-16 md:grid-cols-[1fr_auto] md:items-end md:px-8 md:py-24">
          <div>
            <Reveal variant="mask-up">
              <h2 className="mobile-heading-xl max-w-5xl text-5xl font-black uppercase leading-[0.9] tracking-[-0.06em] md:text-8xl">
                {getText(content.cta.title, locale)}
              </h2>
            </Reveal>
            <p className="mt-7 max-w-3xl text-lg leading-relaxed text-ink/75 md:text-xl">{getText(content.cta.text, locale)}</p>
          </div>
          <a
            href={`mailto:${site.email}?subject=${encodeURIComponent(emailSubject)}`}
            className="inline-flex min-h-32 min-w-32 items-center justify-center rounded-full bg-ink px-7 text-center text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:scale-[1.03] md:min-h-40 md:min-w-40"
          >
            {getText(content.cta.action, locale)}
          </a>
        </div>
      </section>
    </>
  );
}
