import { Link, NavLink, useLocation } from "react-router-dom";
import { site } from "../../data/site";
import { getText, LOCALES, switchLocaleInPath, UI } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function Header() {
  const locale = useLocale();
  const location = useLocation();
  const ui = UI[locale];
  const alternateLocale = Object.keys(LOCALES).find((localeKey) => localeKey !== locale);
  const solutionsLabel = locale === "ru" ? "Решения" : "Solutions";
  const discussLabel = locale === "ru" ? "Обсудить задачу" : "Discuss a project";

  const navLinkClass = ({ isActive }) =>
    `hover:opacity-50 ${isActive ? "opacity-100" : "opacity-70"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-950/10 bg-site/85 px-5 py-4 backdrop-blur-xl md:px-8">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 text-sm font-medium uppercase tracking-[0.08em] md:gap-6">
        <Link to={`/${locale}`} className="shrink-0 text-lg font-black tracking-tight normal-case">
          {getText(site.title, locale)}
        </Link>

        <div className="hidden items-center gap-6 md:flex">
          <NavLink to={`/${locale}/work`} className={navLinkClass}>
            {ui.work}
          </NavLink>

          <Link to={`/${locale}#solutions`} className="opacity-70 hover:opacity-50">
            {solutionsLabel}
          </Link>

          <NavLink to={`/${locale}/about`} className={navLinkClass}>
            {ui.about}
          </NavLink>

          <Link
            to={`/${locale}#contact`}
            className="rounded-full bg-zinc-950 px-4 py-2 text-xs text-white transition hover:bg-zinc-700"
          >
            {discussLabel}
          </Link>

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

        <div className="flex min-w-0 items-center gap-2 md:hidden">
          <NavLink to={`/${locale}/work`} className="text-xs">
            {ui.work}
          </NavLink>
          <Link
            to={switchLocaleInPath(location.pathname, alternateLocale)}
            aria-label={`${LOCALES[alternateLocale].name}: ${LOCALES[alternateLocale].label}`}
            className="inline-flex h-9 min-w-9 items-center justify-center rounded-full border border-zinc-950/20 px-2 text-[0.65rem] transition hover:border-zinc-950"
          >
            {LOCALES[alternateLocale].label}
          </Link>
          <Link
            to={`/${locale}#contact`}
            className="hidden rounded-full bg-zinc-950 px-3 py-2 text-[0.65rem] text-white min-[390px]:inline-flex"
          >
            {locale === "ru" ? "Обсудить" : "Discuss"}
          </Link>
        </div>
      </nav>
    </header>
  );
}
