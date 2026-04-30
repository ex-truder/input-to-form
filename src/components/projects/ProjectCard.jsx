import { Link } from "react-router-dom";
import ProjectMedia from "../media/ProjectMedia";

export default function ProjectCard({ project, index }) {
  const ratio =
    project.ratio === "portrait"
      ? "md:row-span-2 min-h-[520px]"
      : project.ratio === "wide"
        ? "md:col-span-2 min-h-[360px]"
        : "min-h-[360px]";

  return (
    <Link
      to={`/work/${project.slug}`}
      className="block"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <article className={`group relative overflow-hidden rounded-[2rem] bg-zinc-200 ${ratio}`}>
        <div className="absolute inset-0">
          <ProjectMedia
            media={project.cover}
            project={project}
            className="h-full min-h-0 rounded-none"
          />
        </div>

        <div className="absolute inset-0 z-10 bg-black/0 transition duration-300 group-hover:bg-black/5" />

        <div className="absolute inset-x-0 bottom-0 z-20 flex items-end justify-between gap-6 p-5 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm backdrop-blur-md">
            <h3 className="font-semibold tracking-tight text-zinc-950">
              {project.title}
            </h3>
            <p className="mt-1 text-zinc-600">{project.type}</p>
          </div>

          <span className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white">
            Open
          </span>
        </div>
      </article>
    </Link>
  );
}