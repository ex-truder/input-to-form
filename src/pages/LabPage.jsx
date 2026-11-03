import { useState } from "react";
import { experiments } from "../data/lab";
import { getText } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";
import { publicAsset } from "../utils/publicAsset";
import LabArExperiment from "../components/media/LabArExperiment";

function ExperimentCard({ experiment, locale }) {
  const [failed, setFailed] = useState(false);
  return (
    <article className="lab-card min-w-0 overflow-hidden rounded-2xl border" data-experiment={experiment.id}>
      <div className="lab-card__preview relative aspect-[8/5] overflow-hidden">
        {!failed && <img src={publicAsset(experiment.image)} alt="" width="800" height="500"
          loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />}
        <span className="lab-card__status absolute bottom-4 left-4 rounded-full px-3 py-1.5 text-sm font-semibold">
          {locale === "ru" ? "Плейсхолдер" : "Placeholder"}
        </span>
      </div>
        <h2 className="mx-5 mt-5 text-2xl font-bold leading-tight tracking-[-0.02em] [overflow-wrap:anywhere] md:mx-7 md:mt-7 md:text-3xl">
          {getText(experiment.title, locale)}
        </h2>
        <p className="lab-card__description mx-5 mb-5 mt-4 max-w-prose text-base leading-relaxed md:mx-7 md:mb-7 md:text-lg">
          {getText(experiment.description, locale)}
        </p>
    </article>
  );
}

export default function LabPage() {
  const locale = useLocale();
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-12 text-ink md:px-8 md:py-20" aria-labelledby="lab-title">
      <h1 id="lab-title" className="text-[clamp(2rem,6vw,6rem)] font-black leading-[1.08] tracking-[-0.03em] [overflow-wrap:anywhere]">
        {locale === "ru" ? "Лаборатория" : "Lab"}
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink/80 md:text-xl">
        {locale === "ru"
          ? "Место для экспериментов с пространством, движением и изображением. Первый опыт — 3D-модель в вашем пространстве. Остальные исследования пока представлены плейсхолдерами."
          : "A space for experiments with space, motion and images. Start with a 3D model in your space. The other studies are placeholders for now."}
      </p>
      <LabArExperiment locale={locale} />
      {experiments.length ? (
        <div className="lab-card-grid mt-10 grid grid-cols-1 md:mt-14 md:grid-cols-2">
          {experiments.map((experiment) => <ExperimentCard key={experiment.id} experiment={experiment} locale={locale} />)}
        </div>
      ) : <p className="mt-10 text-lg">{locale === "ru" ? "Новые эксперименты появятся здесь позже." : "New experiments will appear here soon."}</p>}
    </section>
  );
}
