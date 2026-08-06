import { Link } from "react-router-dom";
import ViewportMedia from "../components/media/ViewportMedia";
import SocialLinks from "../components/common/SocialLinks";
import Reveal from "../components/motion/Reveal";
import SectionBackground from "../components/backgrounds/SectionBackground";
import { homeContent } from "../data/home";
import { projects } from "../data/projects";
import { site } from "../data/site";
import { getText } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";

const solutionThemes = {
  paper: {
    article: "border-zinc-950/10 bg-site text-zinc-950",
    eyebrow: "text-zinc-500",
    summary: "text-zinc-600",
    tag: "border-zinc-950/15 text-zinc-600",
    divider: "border-zinc-950/10",
    muted: "text-zinc-500",
    body: "text-zinc-600",
    link: "border-ink text-ink",
  },
  surface: {
    article: "border-zinc-950/10 bg-surface text-zinc-950",
    eyebrow: "text-accent",
    summary: "text-zinc-600",
    tag: "border-zinc-950/15 text-zinc-600",
    divider: "border-zinc-950/10",
    muted: "text-zinc-500",
    body: "text-zinc-600",
    link: "border-accent text-accent",
  },
  dark: {
    article: "border-white/15 bg-ink text-white",
    eyebrow: "text-accent",
    summary: "text-white/65",
    tag: "border-white/20 text-white/70",
    divider: "border-white/15",
    muted: "text-white/40",
    body: "text-white/65",
    link: "border-accent text-accent",
  },
  accentSoft: {
    article: "border-zinc-950/10 bg-accent-soft text-zinc-950",
    eyebrow: "text-accent",
    summary: "text-zinc-700",
    tag: "border-zinc-950/20 text-zinc-700",
    divider: "border-zinc-950/15",
    muted: "text-zinc-600",
    body: "text-zinc-700",
    link: "border-ink text-ink",
  },
};

function SolutionSection({ solution }) {
  const locale = useLocale();
  const project = projects.find((candidate) => candidate.slug === solution.projectSlug);
  const theme = solutionThemes[solution.theme] || solutionThemes.paper;

  return (
    <article
      id={solution.id}
      className={`relative isolate scroll-mt-24 overflow-hidden border-t ${theme.article}`}
    >
      <SectionBackground background={solution.background} />
      <div className="relative z-10 mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14">
          <div className="flex flex-col justify-between gap-10">
            <div>
              <p
                className={`font-mono text-sm uppercase tracking-[0.12em] ${theme.eyebrow}`}
              >
                {solution.number} / {getText(solution.label, locale)}
              </p>
              <Reveal variant="mask-up" className="mt-7">
                <h2 className="max-w-3xl text-5xl font-black uppercase leading-[1] tracking-[-0.06em] md:text-7xl">
                  {getText(solution.title, locale)}
                </h2>
              </Reveal>
              <Reveal variant="fade-up" delay={100}>
                <p className={`mt-7 max-w-2xl text-lg leading-relaxed md:text-xl ${theme.summary}`}>
                  {getText(solution.summary, locale)}
                </p>
              </Reveal>
            </div>

            <ul className="flex flex-wrap gap-2" aria-label={locale === "ru" ? "Применение" : "Applications"}>
              {getText(solution.contexts, locale).map((context) => (
                <li
                  key={context}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.09em] ${theme.tag}`}
                >
                  {context}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <Reveal variant="scale-in">
              <ViewportMedia
                media={solution.media}
                project={project}
                className="min-h-[420px] md:min-h-[620px]"
              />
            </Reveal>

            <div
              className={`mt-5 grid gap-5 border-t pt-5 md:grid-cols-[0.42fr_1fr] ${theme.divider}`}
            >
              <div>
                <p
                  className={`text-xs font-semibold uppercase tracking-[0.14em] ${theme.muted}`}
                >
                  {locale === "ru" ? "Проект" : "Project"}
                </p>
                <p className="mt-2 font-bold">{getText(solution.caseTitle, locale)}</p>
              </div>
              <div>
                <p className={`max-w-2xl leading-relaxed ${theme.body}`}>
                  {getText(solution.caseDescription, locale)}
                </p>
                {solution.note && (
                  <p
                    className={`mt-3 text-sm leading-relaxed ${theme.muted}`}
                  >
                    {getText(solution.note, locale)}
                  </p>
                )}
                {project && (
                  <Link
                    to={`/${locale}/work/${project.slug}`}
                    className={`mt-5 inline-flex items-center gap-2 border-b pb-1 text-sm font-semibold uppercase tracking-[0.08em] ${theme.link}`}
                  >
                    {locale === "ru" ? "Смотреть проект" : "View project"}
                    <span aria-hidden="true">↗</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function HomePage() {
  const locale = useLocale();
  const content = homeContent;
  const emailSubject =
    locale === "ru" ? "Задача на визуальный контент" : "Visual content project";

  return (
    <>
      <section className="relative isolate overflow-hidden">
        <SectionBackground background={content.hero.background} />
        <div className="relative z-10 mx-auto max-w-[1600px] px-5 pb-16 pt-14 md:px-8 md:pb-24 md:pt-20">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
          {getText(content.hero.eyebrow, locale)}
          </p>
          <div className="mt-8 grid gap-10 lg:grid-cols-[1.22fr_0.78fr] lg:items-end">
          <Reveal variant="mask-up">
            <h1 className="max-w-6xl text-[12.5vw] font-black uppercase leading-[1] tracking-[-0.07em] md:text-[6vw] lg:text-[5vw]">
              {getText(content.hero.title, locale)}
            </h1>
          </Reveal>
          <Reveal variant="fade-up" delay={120} className="max-w-2xl lg:justify-self-end">
            <div>
            <p className="text-balance text-xl leading-relaxed text-zinc-700 md:text-2xl">
              {getText(content.hero.text, locale)}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(emailSubject)}`}
                className="rounded-full bg-zinc-950 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-zinc-700"
              >
                {getText(content.hero.primaryAction, locale)}
              </a>
              <Link
                to={`/${locale}#solutions`}
                className="rounded-full border border-zinc-950/20 px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.08em] transition hover:border-zinc-950"
              >
                {getText(content.hero.secondaryAction, locale)}
              </Link>
            </div>
            </div>
          </Reveal>
          </div>
          <ul className="mt-14 grid border-y border-zinc-950/10 md:grid-cols-4">
          {content.hero.formats.map((format, index) => (
            <li
              key={getText(format, locale)}
              className="border-b border-zinc-950/10 py-4 text-sm font-medium text-zinc-700 last:border-b-0 md:border-b-0 md:border-r md:px-5 md:first:pl-0 md:last:border-r-0"
            >
              <span className="mr-3 font-mono text-zinc-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              {getText(format, locale)}
            </li>
          ))}
          </ul>
        </div>
      </section>

      <section
        id="solutions"
        className="relative isolate scroll-mt-24 overflow-hidden border-t border-zinc-950/10"
      >
        <SectionBackground background={content.solutionsIntro.background} />
        <div className="relative z-10 mx-auto grid max-w-[1600px] gap-6 px-5 py-16 md:grid-cols-[0.42fr_1fr] md:px-8 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {getText(content.solutionsIntro.eyebrow, locale)}
          </p>
          <Reveal variant="slide-left">
            <h2 className="max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">
              {getText(content.solutionsIntro.title, locale)}
            </h2>
          </Reveal>
        </div>

      </section>

      {content.solutions.map((solution) => (
        <SolutionSection key={solution.id} solution={solution} />
      ))}

      <section
        id="process"
        className="relative isolate scroll-mt-24 overflow-hidden border-t border-zinc-950/10"
      >
        <SectionBackground background={content.process.background} />
        <div className="relative z-10 mx-auto max-w-[1600px] px-5 py-20 md:px-8 md:py-28">
          <div className="grid gap-6 md:grid-cols-[0.42fr_1fr]">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {getText(content.process.eyebrow, locale)}
            </p>
            <Reveal variant="slide-left">
              <h2 className="max-w-5xl text-4xl font-black leading-[0.95] tracking-[-0.055em] md:text-7xl">
                {getText(content.process.title, locale)}
              </h2>
            </Reveal>
          </div>

          <ol className="mt-12 grid gap-px overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-zinc-950/10 md:grid-cols-3">
            {content.process.items.map((item, index) => (
              <Reveal
                key={getText(item.title, locale)}
                as="li"
                variant="fade-up"
                delay={index * 90}
                className="bg-site p-6 md:min-h-72 md:p-8"
              >
                <p className="font-mono text-sm text-zinc-400">
                  {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.035em] md:text-3xl">
                  {getText(item.title, locale)}
                </h3>
                <p className="mt-4 max-w-md leading-relaxed text-zinc-600">
                  {getText(item.text, locale)}
                </p>
              </Reveal>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="contact"
        className="relative isolate scroll-mt-24 overflow-hidden border-t border-zinc-950/10 bg-accent"
      >
        <SectionBackground background={content.cta.background} />
        <div className="relative z-10 mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-700">
            {getText(content.cta.eyebrow, locale)}
          </p>
          <div className="mt-7 grid gap-10 lg:grid-cols-[1fr_0.42fr] lg:items-end">
            <div>
              <Reveal variant="mask-up">
                <h2 className="max-w-6xl text-5xl font-black uppercase leading-[0.86] tracking-[-0.065em] md:text-8xl">
                  {getText(content.cta.title, locale)}
                </h2>
              </Reveal>
              <p className="mt-7 max-w-3xl text-lg leading-relaxed text-zinc-800 md:text-xl">
                {getText(content.cta.text, locale)}
              </p>
            </div>
            <div className="lg:justify-self-end">
              <a
                href={`mailto:${site.email}?subject=${encodeURIComponent(emailSubject)}`}
                className="inline-flex rounded-full bg-zinc-950 px-7 py-4 text-sm font-semibold uppercase tracking-[0.08em] text-white transition hover:bg-zinc-700"
              >
                {getText(content.cta.action, locale)}
              </a>
              <a
                href={`mailto:${site.email}`}
                className="mt-6 block text-2xl font-black tracking-[-0.03em] md:text-3xl"
              >
                {site.email}
              </a>
              <SocialLinks className="mt-6" compact />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
