import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { site } from "../data/site";
import { filters, projects } from "../data/projects";
import ProjectCard from "../components/projects/ProjectCard";
import { getText, UI } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";

export default function HomePage() {
  const locale = useLocale();
  const ui = UI[locale];
  const [active, setActive] = useState("All");

  const visibleProjects = useMemo(() => {
    if (active === "All") return projects;
    return projects.filter((project) => project.type === active);
  }, [active]);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 md:px-8 md:pb-12 md:pt-24">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <h1 className="max-w-5xl text-[16vw] font-black uppercase leading-[0.78] tracking-[-0.04em] md:text-[5vw]">
            {ui.motto}
          </h1>
          <div className="max-w-xl justify-self-end text-balance text-lg leading-relaxed text-zinc-700 md:text-xl">
            {ui.text01}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to={`/${locale}/work`} className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white"
              >
                {ui.viewProjects}
              </Link>
              <a 
              href={`mailto:${site.email}`}
              className="rounded-full border border-zinc-950/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-800"
              >
                {ui.contact}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActive(filter.key)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active === filter.key
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-950/15 bg-white/30 text-zinc-700 hover:border-zinc-950/50"
              }`}
            >
              {getText(filter.label, locale)}
            </button>
          ))}
        </div>

        <div className="grid auto-rows-[180px] grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {visibleProjects.map((project, index) => (
            <ProjectCard key={`${project.slug}-${active}`} project={project} index={index} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-8 px-5 py-24 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-32">
        <h2 className="text-5xl font-black uppercase leading-none tracking-[-0.05em] md:text-8xl">From input to form</h2>
        <div className="grid gap-8 text-lg leading-relaxed text-zinc-700 md:grid-cols-2">
          <p>
            You bring sketches, CAD, scans, briefs, datasets or a vague idea. I build the visual system: models, renders, motion, technical assets and interactive prototypes.
          </p>
          <p>
            The site is now data-driven: add a folder with media, add one object to the projects array, and the homepage, work list and project page update automatically.
          </p>
        </div>
      </section>
    </>
  );
}