import { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import ProgressLogo from "../common/ProgressLogo";
import { LOCALES, switchLocaleInPath, UI } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

export default function Header() {
  const locale = useLocale();
  const location = useLocation();
  const menuRef = useRef(null);
  useEffect(() => {
    menuRef.current?.removeAttribute("open");
  }, [location.pathname, location.hash, location.key]);
  const ui = UI[locale];
  const [logoStep, setLogoStep] = useState(0);
  const isHomePage = location.pathname === `/${locale}`;
  const visibleLogoStep = isHomePage ? logoStep : 0;
  const directionsLabel = locale === "ru" ? "Направления" : "Capabilities";
  const discussLabel = locale === "ru" ? "Обсудить задачу" : "Discuss a project";

  useEffect(() => {
    if (!isHomePage) return undefined;

    let frameId;

    const updateLogoStep = () => {
      frameId = undefined;
      const activationLine = window.innerHeight * 0.5;
      const sections = document.querySelectorAll("[data-logo-step]");
      let nextStep = 0;

      sections.forEach((section) => {
        const step = Number(section.dataset.logoStep);
        if (section.getBoundingClientRect().top <= activationLine) {
          nextStep = Math.max(nextStep, step);
        }
      });

      setLogoStep(nextStep);
    };

    const scheduleUpdate = () => {
      if (frameId === undefined) {
        frameId = window.requestAnimationFrame(updateLogoStep);
      }
    };

    scheduleUpdate();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);

    return () => {
      if (frameId !== undefined) window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, [isHomePage]);

  const navLinkClass = ({ isActive }) =>
    `hover:text-accent-ink ${isActive ? "text-accent-ink underline underline-offset-4" : "text-body"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-950/10 bg-header/95 px-5 py-4 backdrop-blur-xl md:px-8" onKeyDown={(event) => {
      if (event.key === "Escape" && menuRef.current?.open) {
        menuRef.current.removeAttribute("open");
        menuRef.current.querySelector("summary")?.focus();
      }
    }}>
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 text-sm font-medium uppercase tracking-[0.08em]">
        <Link
          to={`/${locale}`}
          aria-label={locale === "ru" ? "kustart.pro — на главную" : "kustart.pro — home"}
          className="inline-flex shrink-0 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-950"
        >
          <ProgressLogo
            activeStep={visibleLogoStep}
            className="h-16 w-auto text-accent md:h-20"
          />
        </Link>

        <div className="hidden items-center gap-6 xl:flex">
          <NavLink to={`/${locale}/work`} className={navLinkClass}>
            {ui.work}
          </NavLink>

          <Link to={{ pathname: `/${locale}`, hash: "#directions" }} className="opacity-70 hover:opacity-50">
            {directionsLabel}
          </Link>

          <NavLink to={`/${locale}/about`} className={navLinkClass}>
            {ui.about}
          </NavLink>

          <Link
            to={{ pathname: `/${locale}`, hash: "#contact" }}
            className="rounded-full bg-ink px-4 py-2 text-xs text-white transition hover:bg-zinc-700"
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
                    ? "border-zinc-950 bg-ink text-white"
                    : "border-zinc-950/15 text-muted hover:border-zinc-950 hover:text-ink"
                }`}
              >
                {localeData.label}
              </Link>
            ))}
          </div>
        </div>

        <details ref={menuRef} className="group xl:hidden">
          <summary className="flex min-h-11 cursor-pointer list-none items-center rounded-full border border-ink/25 px-5 text-sm text-ink focus-visible:outline-2 focus-visible:outline-offset-4 [&::-webkit-details-marker]:hidden">
            {locale === "ru" ? "Меню" : "Menu"}
          </summary>
          <div className="absolute inset-x-5 top-full mt-2 grid gap-1 rounded-2xl border border-ink/15 bg-surface p-4 text-ink [&_a]:flex [&_a]:min-h-11 [&_a]:items-center [&_a]:rounded-lg [&_a]:px-3 [&_a]:focus-visible:outline-2 [&_a]:focus-visible:outline-offset-2 [&_a]:hover:bg-site">
            <NavLink to={`/${locale}/work`} className={navLinkClass}>{ui.work}</NavLink>
            <NavLink to={`/${locale}/about`} className={navLinkClass}>{ui.about}</NavLink>
            <Link to={{ pathname: `/${locale}`, hash: "#directions" }}>{directionsLabel}</Link>
            <Link to={{ pathname: `/${locale}`, hash: "#contact" }}>{discussLabel}</Link>
            <div className="mt-2 flex gap-3 border-t border-ink/15 pt-2">
              {Object.entries(LOCALES).map(([key, value]) => <Link key={key}
                to={switchLocaleInPath(location.pathname, key)} aria-current={key === locale ? "true" : undefined}
                className={key === locale ? "font-bold underline underline-offset-4" : ""}>{value.label}</Link>)}
            </div>
          </div>
        </details>
      </nav>
    </header>
  );
}
