import { Link } from "react-router-dom";
import { projects } from "../data/projects";
import ProjectMedia from "../components/media/ProjectMedia";
import { getText, UI } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";

const pageTitle = {
  en: "I love 3D",
  ru: "Я люблю 3D",
};

const pageDescription = {
  en: "Selected projects: personal studies, commercial visual systems, procedural experiments and asset pipelines. Some projects are visual, some are technical, most combine both.",
  ru: "Подборка проектов: личные исследования, коммерческие визуальные системы, процедурные эксперименты и пайплайны ассетов. Часть проектов визуальные, часть технические, большинство — где-то между.",
};

export default function WorkIndexPage() {
  const locale = useLocale();
  const ui = UI[locale];

  const featuredProject = projects.find((project) => project.featured) || projects[0];

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 md:px-8 md:pb-14 md:pt-24">
        <div className="grid gap-10 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-muted">
              {ui.work}
            </p>

            <h1 className="mobile-heading-xl max-w-5xl text-[10vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[6vw]">
              {getText(pageTitle, locale)}
            </h1>
          </div>

          <div className="max-w-xl text-lg leading-relaxed text-body md:text-xl">
            {getText(pageDescription, locale)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 pb-16 md:px-8 md:pb-24">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Link to={`/${locale}/work/${featuredProject.slug}`} className="min-w-0 text-left">
            <ProjectMedia
              media={featuredProject.cover}
              project={featuredProject}
              className="aspect-[4/3] min-h-0 lg:aspect-auto lg:min-h-[560px]"
              priority
            />

            <div className="mt-5 grid gap-2 md:grid-cols-[auto_1fr] md:items-baseline md:gap-8">
              {featuredProject.duration && <p className="font-mono text-sm text-muted">{featuredProject.duration}</p>}

              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">
                  {ui.featuredOpening}
                </h2>

                <p className="mt-2 text-body">
                  {getText(featuredProject.description, locale)}
                </p>
              </div>
            </div>
          </Link>

          <div className="min-w-0 rounded-[2rem] border border-zinc-950/10 bg-panel p-4 backdrop-blur md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-[-0.04em]">
                {ui.goToProjects}
              </h2>

              <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                {projects.length}
              </span>
            </div>

            <div className="divide-y divide-zinc-950/10">
              {projects.map((project) => (
                <Link
                  key={project.slug}
                  to={`/${locale}/work/${project.slug}`}
                  className="group grid w-full grid-cols-[minmax(0,1fr)_auto] gap-3 py-4 text-left transition hover:pl-2 sm:grid-cols-[4.5rem_minmax(0,1fr)_auto] sm:gap-4"
                >
                  <span className="hidden font-mono text-sm text-muted sm:block">
                    {project.duration}
                  </span>

                  <span className="min-w-0">
                    <span className="block font-semibold text-ink">
                      {getText(project.title, locale)}
                    </span>

                    <span className="mt-1 block text-sm text-muted">
                      {getText(project.description, locale)}
                    </span>
                  </span>

                  <span className="self-center rounded-full border border-zinc-950/10 px-3 py-1 text-xs uppercase tracking-[0.08em] text-muted group-hover:border-zinc-950 group-hover:text-ink">
                    {locale === "ru" ? "Открыть" : "Open"}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

    </>
  );
}
