import { Link, Navigate, useParams } from "react-router-dom";
import { getNextProject, getProject } from "../data/projects";
import ProjectMedia from "../components/media/ProjectMedia";
import ProjectBlocks from "../components/projects/ProjectBlocks";

export default function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) {
    return <Navigate to="/work" replace />;
  }

  const nextProject = getNextProject(project.slug);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-12 md:px-8 md:pb-14 md:pt-20">
        <Link to="/work" className="mb-10 inline-flex rounded-full border border-zinc-950/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600 hover:border-zinc-950 hover:text-zinc-950">
          ← Back to work
        </Link>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {project.type} / {project.year} / {project.client}
            </p>
            <h1 className="text-[17vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[9vw]">
              {project.title}
            </h1>
          </div>
          <div className="max-w-xl text-lg leading-relaxed text-zinc-700 md:text-xl">
            <p className="mb-6 font-semibold text-zinc-950">{project.subtitle}</p>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span key={tool} className="rounded-full border border-zinc-950/15 px-3 py-1 text-sm text-zinc-600">
                  {tool}
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

      <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
        <Link to={`/work/${nextProject.slug}`} className="group block rounded-[2rem] bg-zinc-950 p-6 text-white md:p-10">
          <p className="mb-12 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Next project</p>
          <h3 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] md:text-6xl">{nextProject.title}</h3>
          <p className="mt-4 max-w-xl text-white/60">{nextProject.description}</p>
          <span className="mt-10 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-950 transition group-hover:translate-x-2">
            Open →
          </span>
        </Link>
      </section>
    </>
  );
}
