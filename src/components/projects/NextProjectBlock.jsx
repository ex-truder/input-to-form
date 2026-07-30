import { Link } from "react-router-dom";
import ProjectMedia from "../media/ProjectMedia";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

const copy = {
  kicker: {
    en: "Next project",
    ru: "Следующий проект",
  },
  note: {
    en: "Continue browsing the portfolio.",
    ru: "Продолжить просмотр портфолио.",
  },
  open: {
    en: "Open",
    ru: "Открыть",
  },
};

function getPreviewMedia(project) {
  return (
    project?.cover ||
    project?.hero ||
    {
      type: "placeholder",
      shape: "orb",
      accent: "from-stone-200 via-zinc-100 to-stone-300",
    }
  );
}

export default function NextProjectBlock({ project }) {
  const locale = useLocale();

  if (!project) return null;

  const previewMedia = getPreviewMedia(project);

  return (
    <section className="mx-auto max-w-[1600px] px-5 pb-20 pt-8 md:px-8 md:pb-28 md:pt-10">
      <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
        <div className="rounded-[1.75rem] border border-zinc-950/10 bg-white/35 p-5 backdrop-blur md:p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
            {getText(copy.kicker, locale)}
          </p>

          <p className="mt-3 text-sm leading-relaxed text-zinc-600">
            {getText(copy.note, locale)}
          </p>
        </div>

        <Link
          to={`/${locale}/work/${project.slug}`}
          className="group rounded-[1.75rem] border border-zinc-950/10 bg-white/35 p-4 transition hover:border-zinc-950/25 hover:bg-white/55 md:p-5"
        >
          <div className="grid gap-4 md:grid-cols-[220px_1fr_auto] md:items-center">
            <div className="overflow-hidden rounded-[1.25rem] border border-zinc-950/8 bg-[var(--site-bg)]">
              <ProjectMedia
                media={previewMedia}
                project={project}
                className="aspect-[4/3] min-h-[150px] w-full"
              />
            </div>

            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap gap-2 text-xs uppercase tracking-[0.08em] text-zinc-500">
                {project.type && (
                  <span className="rounded-full border border-zinc-950/10 px-2.5 py-1">
                    {getText(project.type, locale)}
                  </span>
                )}

                {project.year && (
                  <span className="rounded-full border border-zinc-950/10 px-2.5 py-1">
                    {project.year}
                  </span>
                )}
              </div>

              <h2 className="truncate text-2xl font-black tracking-[-0.04em] md:text-3xl">
                {getText(project.title, locale)}
              </h2>

              {project.description && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600 md:text-base">
                  {getText(project.description, locale)}
                </p>
              )}
            </div>

          </div>
        </Link>
      </div>
    </section>
  );
}