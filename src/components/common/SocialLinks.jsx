import { site } from "../../data/site";
import { getText } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";

function SocialIcon({ icon }) {
  if (icon === "telegram") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-15 w-15"
        fill="currentColor"
      >
        <path d="M21.9 4.1c.3-1-.6-1.7-1.5-1.3L2.8 9.6c-1.2.5-1.2 1.6-.2 1.9l4.5 1.4 1.7 5.2c.2.7.4 1 .8 1s.6-.2 1-.5l2.5-2.4 4.7 3.4c.9.5 1.5.3 1.7-.8l2.4-14.7ZM8 12.5l10.4-6.4c.5-.3.9-.1.5.2L10.5 14l-.3 3.1-1.5-4.6Z" />
      </svg>
    );
  }

  if (icon === "email") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="h-15 w-15"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="3" />
        <path d="M4 7.5 12 13l8-5.5" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-15 w-15"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default function SocialLinks({ className = "" }) {
  const locale = useLocale();

  const links = [
    ...site.socials,
    {
      label: {
        en: "Email",
        ru: "Почта",
      },
      href: `mailto:${site.email}`,
      icon: "email",
    },
  ];

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {links.map((social) => {
        const label = getText(social.label, locale);

        return (
          <a
            key={social.icon}
            href={social.href}
            aria-label={label}
            title={label}
            target={social.href.startsWith("mailto:") ? undefined : "_blank"}
            rel={social.href.startsWith("mailto:") ? undefined : "noreferrer"}
            className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-zinc-950/10 bg-white/35 text-zinc-700 transition hover:border-zinc-950/25 hover:bg-white/60 hover:text-zinc-950"
          >
            <SocialIcon icon={social.icon} />
          </a>
        );
      })}
    </div>
  );
}