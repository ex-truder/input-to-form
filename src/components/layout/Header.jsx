import { Link, NavLink, useLocation } from "react-router-dom";
import { site } from "../../data/site";
import { getText, LOCALES, switchLocaleInPath, UI } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function Header() {
  const locale = useLocale();
  const location = useLocation();
  const ui = UI[locale];
  const directionsLabel = locale === "ru" ? "Направления" : "Capabilities";
  const discussLabel = locale === "ru" ? "Обсудить задачу" : "Discuss a project";

  const navLinkClass = ({ isActive }) =>
    `hover:opacity-50 ${isActive ? "opacity-100" : "opacity-70"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-950/10 bg-[#f6f3ec]/85 px-5 py-4 backdrop-blur-xl md:px-8">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 text-sm font-medium uppercase tracking-[0.08em]">
        <Link to={`/${locale}`} className="text-lg font-black tracking-tight normal-case">
          {getText(site.title, locale)}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to={`/${locale}/work`} className={navLinkClass}>
            {ui.work}
          </NavLink>

          <a href={`/${locale}#directions`} className="opacity-70 hover:opacity-50">
            {directionsLabel}
          </a>

          <NavLink to={`/${locale}/about`} className={navLinkClass}>
            {ui.about}
          </NavLink>

          <a
            href={`/${locale}#contact`}
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs text-white transition hover:bg-zinc-700"
          >
            {discussLabel}
          </a>

          <div className="flex items-center gap-2">
            {Object.entries(LOCALES).map(([localeKey, localeData]) => (
              <Link
                key={localeKey}
                to={switchLocaleInPath(location.pathname, localeKey)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  locale === localeKey
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-950/15 text-zinc-500 hover:border-zinc-950 hover:text-zinc-950"
                }`}
              >
                {localeData.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 md:hidden">
          <NavLink to={`/${locale}/work`}>{ui.work}</NavLink>
          <a
            href={`/${locale}#contact`}
            className="rounded-full bg-zinc-950 px-3 py-2 text-[0.65rem] text-white"
          >
            {locale === "ru" ? "Обсудить" : "Discuss"}
          </a>
        </div>
      </nav>
    </header>
  );
}
