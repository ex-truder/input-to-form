import { site } from "../../data/site";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
import SocialLinks from "../common/SocialLinks";

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
      <SocialLinks />
      </div>
    </footer>
  );
}