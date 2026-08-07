import { getText } from "../i18n/config";
import { useLocale } from "../i18n/useLocale";
import { publicAsset } from "../utils/publicAsset";

const aboutCopy = {
  title: {
    en: "Hey! I'm Roman.",
    ru: "Привет! Я Роман.",
  },

  lead: {
    en: "I build procedural 3D systems, visual assets and interactive prototypes from sketches, datasets, geometry, product briefs and visual references.",
    ru: "Я создаю процедурные 3D-системы, визуальные ассеты и интерактивные прототипы из эскизов, датасетов, геометрии, продуктовых брифов и визуальных референсов.",
  },

  paragraph: {
    en: "A lot of my production work is unique, technical or NDA-constrained, so this portfolio focuses on visual taste, systems thinking and the quality of outputs.",
    ru: "Многие рабочие проекты уникальны, технически сложны или ограничены NDA, поэтому это портфолио фокусируется на визуальном вкусе, системном мышлении и качестве результата.",
  },

  roleLabel: {
    en: "What I do",
    ru: "Что я делаю",
  },

  roles: {
    en: ["Procedural 3D", "Product visuals", "Asset pipelines", "Interactive systems"],
    ru: ["Процедурный 3D", "Продуктовые визуалы", "Пайплайны ассетов", "Интерактивные системы"],
  },

  portraitAlt: {
    en: "Portrait photo",
    ru: "Портретное фото",
  },
};


export default function AboutPage() {
  const locale = useLocale();
  const roles = getText(aboutCopy.roles, locale);

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-12 md:px-8 md:py-20">
      <div className="grid gap-8 lg:grid-cols-[0.48fr_0.52fr] lg:items-center">
        <div className="overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-white/35">
          <img
            src={publicAsset("/about/portrait.jpg")}
            alt={getText(aboutCopy.portraitAlt, locale)}
            className="aspect-[4/5] h-full w-full object-cover grayscale"
          />
        </div>

        <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 backdrop-blur md:p-10 lg:p-12">
          <h1 className="mobile-heading-xl max-w-4xl text-6xl font-black uppercase leading-[0.82] tracking-[-0.07em] text-zinc-950 md:text-8xl lg:text-9xl">
            {getText(aboutCopy.title, locale)}
          </h1>

          <div className="mt-8 max-w-4xl space-y-6 text-xl leading-relaxed text-zinc-700 md:text-2xl">
            <p>{getText(aboutCopy.lead, locale)}</p>
            <p>{getText(aboutCopy.paragraph, locale)}</p>
          </div>

          <div className="mt-10">
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {getText(aboutCopy.roleLabel, locale)}
            </p>

            <div className="flex flex-wrap gap-2">
              {roles.map((role) => (
                <span
                  key={role}
                  className="rounded-full border border-zinc-950/10 bg-accent px-4 py-2 text-sm font-medium text-zinc-950"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
