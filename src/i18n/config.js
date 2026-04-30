export const DEFAULT_LOCALE = "en";

export const LOCALES = {
  en: {
    label: "EN",
    name: "English",
  },
  ru: {
    label: "RU",
    name: "Русский",
  },
};

export const UI = {
  en: {
    work: "Work",
    projects: "Projects",
    viewProjects: "View projects",
    contact: "Contact",
    about: "About",
    backToWork: "Back to work",
    nextProject: "Next project",
    goToProjects: "Go to Projects",
    featuredOpening: "Featured Opening",
    projectNote: "Project note",
    process: "Process",
    all: "All",
    mostlyNda: "Mostly NDA-friendly",
    mostlyNdaText:
      "The public version focuses on process, taste and production logic. Real client materials can be swapped in later as images, videos or protected case studies.",
  },

  ru: {
    work: "Работы",
    projects: "Проекты",
    viewProjects: "Смотреть проекты",
    contact: "Связаться",
    about: "Обо мне",
    backToWork: "Назад к работам",
    nextProject: "Следующий проект",
    goToProjects: "К проектам",
    featuredOpening: "Избранный проект",
    projectNote: "О проекте",
    process: "Процесс",
    all: "Все",
    mostlyNda: "NDA-friendly",
    mostlyNdaText:
      "Публичная версия портфолио фокусируется на процессе, визуальном мышлении и производственной логике. Реальные клиентские материалы можно добавлять позже как изображения, видео или закрытые кейсы.",
  },
};

export function isValidLocale(locale) {
  return Object.keys(LOCALES).includes(locale);
}

export function getText(value, locale = DEFAULT_LOCALE) {
  if (value == null) return "";

  if (typeof value === "string") {
    return value;
  }

  return value[locale] || value[DEFAULT_LOCALE] || Object.values(value)[0] || "";
}

export function getLocaleFromPathname(pathname) {
  const firstSegment = pathname.split("/").filter(Boolean)[0];

  if (isValidLocale(firstSegment)) {
    return firstSegment;
  }

  return DEFAULT_LOCALE;
}

export function localizePath(path, locale) {
  if (path === "/") {
    return `/${locale}`;
  }

  return `/${locale}${path}`;
}

export function switchLocaleInPath(pathname, nextLocale) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length > 0 && isValidLocale(segments[0])) {
    segments[0] = nextLocale;
    return `/${segments.join("/")}`;
  }

  return `/${nextLocale}/${segments.join("/")}`;
}