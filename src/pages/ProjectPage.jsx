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
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-12 md:px-8 md:pb-14 md:pt-20">
        <Link to={`/${locale}/work`}>
          ← {ui.backToWork}
        </Link>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {getText(project.type, locale)} / {project.year} / {getText(project.client, locale)}
            </p>
            <h1 className="text-[17vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[9vw]">
              {getText(project.title, locale)}
            </h1>
          </div>
          <div className="max-w-xl text-lg leading-relaxed text-zinc-700 md:text-xl">
            <p className="mb-6 font-semibold text-zinc-950">{getText(project.subtitle, locale)}</p>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span key={getText(tool, locale)}>
                  {getText(tool, locale)}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <ProjectMedia media={project.hero} project={project} className="min-h-[72vh]" priority />
      </section>

      <ProjectBlocks project={project} />
      <NextProjectBlock project={nextProject} />

    </>
  );
}
