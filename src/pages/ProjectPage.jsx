import { Link, Navigate, useParams } from "react-router-dom";
import { getNextProject, getProject } from "../data/projects";
import ProjectMedia from "../components/media/ProjectMedia";
import ProjectBlocks from "../components/projects/ProjectBlocks";
import { getText, UI } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";
import NextProjectBlock from "../components/projects/NextProjectBlock";

export default function ProjectPage() {
  const locale = useLocale();
  const ui = UI[locale];
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) {
    return <Navigate to="/work" replace />;
  }

  const nextProject = getNextProject(project.slug);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-4 pt-12 md:px-8 md:pb-5 md:pt-20">
        <Link to={`/${locale}/work`}>
          ← {ui.backToWork}
        </Link>

        <div className="grid gap-8 pt-6 md:items-end md:pt-10">
          <div className="min-w-0">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-900">
              {getText(project.type, locale)} / {project.year} / {getText(project.client, locale)}
            </p>
            <h1 className={project.caseStudy
              ? "mobile-heading-xl max-w-[1450px] text-[clamp(3.5rem,10vw,10rem)] font-black leading-[0.82] tracking-[-0.075em]"
              : "mobile-heading-xl text-[17vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[5vw]"}>
              {getText(project.title, locale)}
            </h1>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-5 md:px-8 md:pb-5 md:pt-5">
        <div className={`grid gap-8 text-lg leading-relaxed text-zinc-700 md:text-xl ${project.caseStudy ? "max-w-6xl md:grid-cols-2" : "max-w-xl"}`}>
          <div>
            <p className="mb-5 text-2xl font-semibold leading-tight text-zinc-950 md:text-3xl">
              {getText(project.subtitle, locale)}
              </p>
              {project.description && (
                <p className="mb-6 text-base leading-relaxed text-zinc-600 md:text-lg">
                  {getText(project.description, locale)}
                </p>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span key={getText(tool, locale)} className="h-fit rounded-full border border-zinc-950/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-zinc-600">
                  {getText(tool, locale)}
                </span>
              ))}
            </div>
          </div>
      </section>
      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <ProjectMedia media={project.hero} project={project} className={project.caseStudy ? "aspect-[4/3] min-h-0 md:aspect-[16/9]" : "min-h-[72vh]"} priority />
      </section>

      <ProjectBlocks project={project} />
      <NextProjectBlock project={nextProject} />

    </>
  );
}
