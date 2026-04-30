import { site } from "../../data/site";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function Footer() {
  const locale = useLocale();

  return (
    <footer className="border-t border-zinc-950/10 px-5 py-10 md:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <a
            href={`mailto:${site.email}`}
            className="mb-4 block text-left text-3xl font-black tracking-tight md:text-5xl"
          >
            {site.email}
          </a>

          <p className="max-w-xl text-zinc-600">
            {getText(site.description, locale)}
          </p>
        </div>

        <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-[0.08em]">
          {site.socials.map((social) => (
            <a key={social.label} href={social.href} className="hover:opacity-50">
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}