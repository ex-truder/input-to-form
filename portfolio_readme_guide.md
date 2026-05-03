# Portfolio Engine README

Подробный гайд по поддержке статического двуязычного портфолио-сайта на **React + Vite + Tailwind + React Router**.

Сайт устроен как маленький **portfolio engine без CMS**: дизайн и шаблоны живут в React-компонентах, а кейсы добавляются через данные и медиа-файлы.

---

## 0. Что это за проект

Это статический сайт-портфолио с двуязычной структурой:

```txt
/en
/en/work
/en/work/project-slug
/en/about

/ru
/ru/work
/ru/work/project-slug
/ru/about
```

Главная идея:

```txt
Один дизайн
Один набор компонентов
Один массив проектов
Два языка через data objects
Без CMS
Без отдельных страниц под каждый кейс
```

Проекты добавляются не через ручную вёрстку отдельных страниц, а через объект в `src/data/projects.js`.

---

## 1. Главный рабочий процесс

Чтобы добавить новый кейс:

```txt
1. Придумать slug проекта
2. Создать папку public/projects/project-slug/
3. Положить туда cover, hero и дополнительные медиа
4. Добавить объект проекта в src/data/projects.js
5. Описать наполнение страницы через blocks
6. Проверить /en/work/project-slug и /ru/work/project-slug
7. Запустить npm run build
8. Сделать commit / push
```

После добавления проекта он автоматически появится:

```txt
/en и /ru                    главная страница
/en/work и /ru/work          список проектов
/en/work/project-slug        страница проекта EN
/ru/work/project-slug        страница проекта RU
```

---

## 2. Рекомендуемая структура проекта

```txt
src/
├── App.jsx
├── main.jsx
├── index.css
│
├── data/
│   ├── site.js
│   └── projects.js
│
├── i18n/
│   ├── config.js
│   └── useLocale.js
│
├── components/
│   ├── layout/
│   │   ├── Header.jsx
│   │   └── Footer.jsx
│   │
│   ├── media/
│   │   ├── Shape.jsx
│   │   ├── PlaceholderVisual.jsx
│   │   └── ProjectMedia.jsx
│   │
│   ├── projects/
│   │   ├── ProjectCard.jsx
│   │   └── ProjectBlocks.jsx
│   │
│   └── utils/
│       └── ScrollToTop.jsx
│
└── pages/
    ├── HomePage.jsx
    ├── WorkIndexPage.jsx
    ├── ProjectPage.jsx
    └── AboutPage.jsx
```

Медиа-файлы лежат отдельно:

```txt
public/
└── projects/
    ├── synthetic-plant/
    │   ├── cover.jpg
    │   ├── hero.mp4
    │   ├── 01.jpg
    │   ├── 02.jpg
    │   └── 03.jpg
    │
    └── scan-cleanup/
        ├── cover.jpg
        ├── hero.jpg
        ├── process-01.jpg
        └── result-01.mp4
```

Важно: в коде путь к файлам из `public` начинается **без ****/public**.

Правильно:

```js
src: "/projects/synthetic-plant/cover.jpg"
```

Неправильно:

```js
src: "/public/projects/synthetic-plant/cover.jpg"
```

---

## 3. Установка и запуск

Установка зависимостей:

```bash
npm install
```

Запуск локального dev-сервера:

```bash
npm run dev
```

Обычно сайт открывается по адресу:

```txt
http://localhost:5173/
```

Проверочные страницы:

```txt
http://localhost:5173/en
http://localhost:5173/ru

http://localhost:5173/en/work
http://localhost:5173/ru/work

http://localhost:5173/en/work/synthetic-plant
http://localhost:5173/ru/work/synthetic-plant

http://localhost:5173/en/about
http://localhost:5173/ru/about
```

Production-сборка:

```bash
npm run build
```

Локальная проверка production-сборки:

```bash
npm run preview
```

---

# Часть 1. Двуязычность

---

## 4. Как устроена двуязычность

Двуязычность работает через:

```txt
1. URL-префикс языка: /en или /ru
2. объектные поля вида { en: "...", ru: "..." }
3. helper getText(value, locale)
4. hook useLocale()
5. словарь интерфейса UI
```

Например:

```js
title: {
  en: "Synthetic Plant",
  ru: "Синтетическое растение",
}
```

При открытии `/en/work/synthetic-plant` будет взят английский текст.

При открытии `/ru/work/synthetic-plant` будет взят русский текст.

---

## 5. Файл `src/i18n/config.js`

В этом файле находятся:

```txt
DEFAULT_LOCALE
LOCALES
UI
isValidLocale()
getText()
getLocaleFromPathname()
localizePath()
switchLocaleInPath()
```

Пример структуры:

```js
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
```

`DEFAULT_LOCALE` — язык по умолчанию.

Если пользователь откроет `/`, его можно отправить на:

```txt
/en
```

---

## 6. Словарь интерфейса `UI`

В `UI` хранятся короткие интерфейсные тексты:

```js
export const UI = {
  en: {
    work: "Work",
    viewProjects: "View projects",
    contact: "Contact",
    about: "About",
    backToWork: "Back to work",
    nextProject: "Next project",
    goToProjects: "Go to Projects",
    featuredOpening: "Featured Opening",
    process: "Process",
    all: "All",
  },

  ru: {
    work: "Работы",
    viewProjects: "Смотреть проекты",
    contact: "Связаться",
    about: "Обо мне",
    backToWork: "Назад к работам",
    nextProject: "Следующий проект",
    goToProjects: "К проектам",
    featuredOpening: "Избранный проект",
    process: "Процесс",
    all: "Все",
  },
};
```

Здесь лучше хранить:

```txt
пункты меню
названия кнопок
служебные подписи
лейблы вроде Next project / Back to work
```

Не стоит хранить здесь тексты самих проектов. Тексты проектов должны жить в `projects.js`.

---

## 7. Helper `getText()`

`getText()` нужен, чтобы безопасно получать текст на нужном языке.

Он должен поддерживать оба формата:

### Старый формат

```js
title: "Glass System"
```

### Новый bilingual-формат

```js
title: {
  en: "Glass System",
  ru: "Стеклянная система",
}
```

Пример функции:

```js
export function getText(value, locale = DEFAULT_LOCALE) {
  if (value == null) return "";

  if (typeof value === "string") {
    return value;
  }

  return value[locale] || value[DEFAULT_LOCALE] || Object.values(value)[0] || "";
}
```

Это значит, что проект можно переводить постепенно. Если поле пока строка — сайт не сломается.

---

## 8. Hook `useLocale()`

Файл:

```txt
src/i18n/useLocale.js
```

Hook определяет текущий язык из URL.

Пример:

```js
import { useLocation, useParams } from "react-router-dom";
import { DEFAULT_LOCALE, getLocaleFromPathname, isValidLocale } from "./config";

export function useLocale() {
  const params = useParams();
  const location = useLocation();

  if (params.locale && isValidLocale(params.locale)) {
    return params.locale;
  }

  return getLocaleFromPathname(location.pathname) || DEFAULT_LOCALE;
}
```

Использование:

```js
const locale = useLocale();
```

---

## 9. Маршруты в `App.jsx`

Файл:

```txt
src/App.jsx
```

Маршруты должны быть языковыми:

```jsx
<Routes>
  <Route path="/" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />

  <Route path="/work" element={<Navigate to={`/${DEFAULT_LOCALE}/work`} replace />} />
  <Route path="/about" element={<Navigate to={`/${DEFAULT_LOCALE}/about`} replace />} />

  <Route path="/:locale" element={<LocaleGuard><HomePage /></LocaleGuard>} />
  <Route path="/:locale/work" element={<LocaleGuard><WorkIndexPage /></LocaleGuard>} />
  <Route path="/:locale/work/:slug" element={<LocaleGuard><ProjectPage /></LocaleGuard>} />
  <Route path="/:locale/about" element={<LocaleGuard><AboutPage /></LocaleGuard>} />

  <Route path="*" element={<Navigate to={`/${DEFAULT_LOCALE}`} replace />} />
</Routes>
```

Старые пути можно редиректить:

```txt
/work → /en/work
/about → /en/about
/work/project-slug → /en/work/project-slug
```

---

## 10. Переключатель языка

Переключатель языка находится в `Header.jsx`.

Он должен менять только языковой сегмент URL, сохраняя текущую страницу.

Например:

```txt
/en/work/synthetic-plant → /ru/work/synthetic-plant
/ru/about → /en/about
```

Для этого используется:

```js
switchLocaleInPath(location.pathname, localeKey)
```

Пример:

```jsx
{Object.entries(LOCALES).map(([localeKey, localeData]) => (
  <Link
    key={localeKey}
    to={switchLocaleInPath(location.pathname, localeKey)}
    className={locale === localeKey ? "...active" : "...inactive"}
  >
    {localeData.label}
  </Link>
))}
```

---

# Часть 2. Где менять дизайн

---

## 11. Общие настройки сайта

Файл:

```txt
src/data/site.js
```

Пример:

```js
export const site = {
  title: {
    en: "Input to Form",
    ru: "Input to Form",
  },

  email: "hello@example.com",

  description: {
    en: "Procedural 3D, product visuals, simulations, asset pipelines and interactive visual systems.",
    ru: "Процедурная 3D-графика, продуктовые визуалы, симуляции, пайплайны ассетов и интерактивные визуальные системы.",
  },

  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Behance", href: "#" },
  ],
};
```

Здесь менять:

```txt
название сайта
email
описание в футере
соцсети
```

---

## 12. Глобальные стили

Файл:

```txt
src/index.css
```

Минимально:

```css
@import "tailwindcss";

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
}
```

Глобальные правки можно добавлять сюда, но основная стилизация проекта делается Tailwind-классами прямо в компонентах.

---

## 13. Общий фон и shell сайта

Файл:

```txt
src/App.jsx
```

Основной wrapper:

```jsx
<main className="min-h-screen bg-[#f6f3ec] text-zinc-950 selection:bg-zinc-950 selection:text-white">
  <Header />
  <Routes>...</Routes>
  <Footer />
</main>
```

Чтобы поменять фон всего сайта:

```txt
bg-[#f6f3ec]
```

Например:

```txt
bg-white
bg-zinc-950 text-white
bg-[#111111] text-white
```

---

## 14. Header

Файл:

```txt
src/components/layout/Header.jsx
```

Здесь менять:

```txt
логотип / название
пункты меню
email в хедере
переключатель языка
мобильную навигацию
```

Важно: ссылки должны включать `locale`.

Правильно:

```jsx
<NavLink to={`/${locale}/work`}>
  {ui.work}
</NavLink>
```

Неправильно:

```jsx
<NavLink to="/work">
  Work
</NavLink>
```

---

## 15. Footer

Файл:

```txt
src/components/layout/Footer.jsx
```

Footer должен брать язык через:

```js
const locale = useLocale();
```

И выводить переводимые тексты через:

```js
getText(site.description, locale)
```

Если нужно поменять только текст — меняй `site.js`.

Если нужно поменять внешний вид — меняй `Footer.jsx`.

---

## 16. Главная страница

Файл:

```txt
src/pages/HomePage.jsx
```

Здесь находятся:

```txt
hero-заголовок
описание
кнопки View projects / Contact
фильтры
bento/grid карточек
нижний текстовый блок
```

Все тексты, которые должны быть двуязычными, можно хранить прямо в компоненте как объекты:

```js
const heroTitle = {
  en: "I’d like this to be my 3D CV",
  ru: "Я хочу, чтобы это было моим 3D-портфолио",
};
```

И выводить так:

```jsx
{getText(heroTitle, locale)}
```

Или вынести эти тексты в отдельный словарь, если их станет много.

---

## 17. Страница списка проектов `/en/work` и `/ru/work`

Файл:

```txt
src/pages/WorkIndexPage.jsx
```

Здесь находятся:

```txt
заголовок страницы
описание
featured-блок
список Go to Projects
нижний NDA-friendly блок
```

Featured-проект выбирается автоматически:

```js
const featuredProject = projects.find((project) => project.featured) || projects[0];
```

То есть берётся первый проект с:

```js
featured: true
```

Если таких несколько — будет выбран первый в массиве.

---

## 18. Страница проекта `/en/work/:slug` и `/ru/work/:slug`

Файл:

```txt
src/pages/ProjectPage.jsx
```

Здесь находится универсальный шаблон проекта:

```txt
Back to work
project meta: type / year / client
title
subtitle
tool tags
hero media
blocks
next project
```

При добавлении нового проекта сюда обычно лезть не нужно.

Сюда нужно лезть, только если меняется структура **всех** страниц проектов.

Например:

```txt
добавить логотип клиента
изменить расположение title/subtitle
убрать year/client
поменять стили tags
изменить блок Next project
```

---

## 19. Карточка проекта

Файл:

```txt
src/components/projects/ProjectCard.jsx
```

Карточка используется на главной.

Здесь настраивается:

```txt
размер карточки
hover-состояние
cover media
название проекта
тип проекта
кнопка Open
```

Карточка должна ссылаться на языковой URL:

```jsx
<Link to={`/${locale}/work/${project.slug}`}>
```

Тексты должны выводиться через:

```jsx
{getText(project.title, locale)}
{getText(project.type, locale)}
```

---

## 20. Размеры карточек

Размер карточки зависит от поля:

```js
ratio: "wide"
ratio: "portrait"
ratio: "square"
```

Рекомендуемая логика:

```jsx
const ratio =
  project.ratio === "portrait"
    ? "md:row-span-3 min-h-[520px]"
    : project.ratio === "wide"
      ? "md:col-span-2 md:row-span-2 min-h-[360px]"
      : "md:row-span-2 min-h-[360px]";
```

Важно: `row-span` и `col-span` должны быть на **прямом grid item**, то есть на корневом элементе карточки, обычно `<Link>`.

Хорошо:

```jsx
<Link className={`group relative block ... ${ratio}`}>
  ...
</Link>
```

Плохо:

```jsx
<Link className="block">
  <article className={ratio}>...</article>
</Link>
```

Во втором случае CSS Grid не увидит размеры карточки правильно.

---

## 21. Grid на главной

Файл:

```txt
src/pages/HomePage.jsx
```

Рекомендуемый grid:

```jsx
<div className="grid grid-cols-1 gap-5 md:auto-rows-[180px] md:grid-cols-3 xl:grid-cols-4">
  {visibleProjects.map((project, index) => (
    <ProjectCard key={`${project.slug}-${active}`} project={project} index={index} />
  ))}
</div>
```

Почему `md:auto-rows-[180px]`, а не просто `auto-rows-[180px]`:

```txt
На мобильной версии одна колонка, карточки должны идти обычным потоком.
На desktop нужен bento/grid layout с row-span.
```

---

# Часть 3. Медиа и placeholders

---

## 22. ProjectMedia

Файл:

```txt
src/components/media/ProjectMedia.jsx
```

Компонент отвечает за:

```txt
image
video
fallback на placeholder
ошибку загрузки медиа
object-cover
alt-тексты
```

Поддерживаемые типы:

```js
{ type: "image", src: "..." }
{ type: "video", src: "..." }
{ type: "placeholder" }
```

Если картинка или видео не загрузились, компонент должен показать placeholder.

---

## 23. Bilingual alt для изображений

`alt` можно писать строкой:

```js
alt: "Project image"
```

Или объектом:

```js
alt: {
  en: "Project image",
  ru: "Изображение проекта",
}
```

В `ProjectMedia.jsx` лучше выводить так:

```jsx
alt={getText(media.alt, locale) || getText(project?.title, locale) || "Project media"}
```

---

## 24. Изображения

Формат:

```js
{
  type: "image",
  src: "/projects/new-project/cover.jpg",
  alt: {
    en: "New Project cover image",
    ru: "Обложка проекта New Project",
  },
}
```

Рекомендации:

```txt
cover.jpg — 1600–2400 px по ширине
hero.jpg — 2400–3200 px по ширине
дополнительные изображения — 1600–2400 px по ширине
```

Форматы:

```txt
.jpg
.jpeg
.png
.webp
.avif
```

---

## 25. Видео

Формат:

```js
{
  type: "video",
  src: "/projects/new-project/hero.mp4",
  poster: "/projects/new-project/cover.jpg",
}
```

По умолчанию видео обычно:

```txt
autoplay
muted
loop
playsInline
controls = false
```

Если нужен обычный плеер:

```js
{
  type: "video",
  src: "/projects/new-project/hero.mp4",
  controls: true,
  autoPlay: false,
  loop: false,
}
```

---

## 26. Placeholder

Placeholder можно использовать, пока нет готовых материалов:

```js
cover: { type: "placeholder" },
hero: { type: "placeholder" },
```

Или внутри блоков:

```js
{
  type: "media",
  media: {
    type: "placeholder",
    shape: "console",
    accent: "from-violet-100 via-slate-200 to-cyan-100"
  },
  size: "large"
}
```

Поддерживаемые shape:

```txt
orb
pencil
ribbon
totem
box
blob
grid
plant
scan
cloth
stack
console
```

---

## 26.1. 3D-модели

Для интерактивного отображения 3D-моделей используется отдельный block type:

```txt
model3d
```

Рекомендуемый формат моделей:

```txt
.glb
```

Можно также использовать:

```txt
.gltf
```

Но для сайта удобнее `.glb`, потому что это один файл, внутри которого могут лежать геометрия, материалы и текстуры.

Модели лучше хранить так:

```txt
public/projects/project-slug/models/model.glb
public/projects/project-slug/models/model-poster.jpg
```

В коде путь будет:

```js
src: "/projects/project-slug/models/model.glb"
poster: "/projects/project-slug/models/model-poster.jpg"
```

Не писать `/public` в пути.

---

## 26.2. Установка viewer для 3D-моделей

Для простого portfolio-viewer удобнее использовать `@google/model-viewer`.

Установка:

```bash
npm install @google/model-viewer
```

Этот пакет добавляет web component:

```html
<model-viewer></model-viewer>
```

В React-проекте достаточно импортировать пакет один раз в компоненте, где используется viewer:

```js
import "@google/model-viewer";
```

---

## 26.3. Добавить block `model3d` в `ProjectBlocks.jsx`

Файл:

```txt
src/components/projects/ProjectBlocks.jsx
```

В начало файла добавить импорт:

```js
import "@google/model-viewer";
```

Если в файле уже есть импорты `ProjectMedia`, `getText`, `useLocale`, итоговое начало может выглядеть так:

```js
import "@google/model-viewer";
import ProjectMedia from "../media/ProjectMedia";
import { getText, UI } from "../../i18n/config";
import { useLocale } from "../../i18n/useLocale";
```

Затем добавить функцию блока:

```jsx
function Model3DBlock({ block }) {
  const locale = useLocale();

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <div className="overflow-hidden rounded-[2rem] border border-zinc-950/10 bg-white/35">
        <div className="grid gap-0 lg:grid-cols-[1fr_0.38fr]">
          <div className="relative min-h-[560px] bg-zinc-100">
            <model-viewer
              src={block.src}
              poster={block.poster}
              alt={getText(block.alt, locale) || "3D model"}
              camera-controls
              auto-rotate={block.autoRotate ?? true}
              rotation-per-second={block.rotationPerSecond || "24deg"}
              shadow-intensity={block.shadowIntensity ?? 0.8}
              exposure={block.exposure ?? 1}
              camera-orbit={block.cameraOrbit}
              field-of-view={block.fieldOfView || "35deg"}
              environment-image={block.environmentImage || "neutral"}
              ar={block.ar ?? false}
              loading="lazy"
              reveal="auto"
              class="h-full w-full"
            />
          </div>

          <div className="flex flex-col justify-between gap-8 p-6 md:p-10">
            <div>
              {block.label && (
                <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  {getText(block.label, locale)}
                </p>
              )}

              {block.title && (
                <h2 className="mb-5 text-4xl font-black leading-none tracking-[-0.05em] md:text-6xl">
                  {getText(block.title, locale)}
                </h2>
              )}

              {block.text && (
                <p className="text-lg leading-relaxed text-zinc-700">
                  {getText(block.text, locale)}
                </p>
              )}
            </div>

            {block.meta?.length > 0 && (
              <div className="grid gap-3 border-t border-zinc-950/10 pt-5 text-sm">
                {block.meta.map((item, index) => (
                  <div key={index} className="grid grid-cols-[0.4fr_1fr] gap-4">
                    <span className="text-zinc-500">{getText(item.label, locale)}</span>
                    <span className="font-medium text-zinc-950">{getText(item.value, locale)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {block.caption && (
        <p className="mt-3 text-sm text-zinc-500">
          {getText(block.caption, locale)}
        </p>
      )}
    </section>
  );
}
```

После этого добавить новый тип в renderer `ProjectBlocks`:

```jsx
if (block.type === "model3d") {
  return <Model3DBlock key={index} block={block} />;
}
```

Итоговый renderer будет примерно таким:

```jsx
export default function ProjectBlocks({ project }) {
  return project.blocks?.map((block, index) => {
    if (block.type === "text") return <TextBlock key={index} block={block} />;
    if (block.type === "media") return <MediaBlock key={index} block={block} project={project} />;
    if (block.type === "mediaGrid") return <MediaGridBlock key={index} block={block} project={project} />;
    if (block.type === "model3d") return <Model3DBlock key={index} block={block} />;
    if (block.type === "process") return <ProcessBlock key={index} block={block} />;
    if (block.type === "quote") return <QuoteBlock key={index} block={block} />;
    if (block.type === "credits") return <CreditsBlock key={index} block={block} />;
    return null;
  });
}
```

---

## 26.4. Пример использования блока `model3d`

В `projects.js` внутри `blocks`:

```js
{
  type: "model3d",

  label: {
    en: "Interactive model",
    ru: "Интерактивная модель",
  },

  title: {
    en: "Realtime asset preview",
    ru: "Превью realtime-ассета",
  },

  text: {
    en: "Rotate, zoom and inspect the optimized 3D model directly in the browser.",
    ru: "Модель можно вращать, приближать и рассматривать прямо в браузере.",
  },

  src: "/projects/robot-arm/models/robot-arm.glb",
  poster: "/projects/robot-arm/models/robot-arm-poster.jpg",

  alt: {
    en: "Interactive 3D model of a robot arm",
    ru: "Интерактивная 3D-модель роботизированной руки",
  },

  autoRotate: true,
  rotationPerSecond: "18deg",
  shadowIntensity: 0.9,
  exposure: 1,
  fieldOfView: "35deg",
  environmentImage: "neutral",

  meta: [
    {
      label: {
        en: "Format",
        ru: "Формат",
      },
      value: "GLB",
    },
    {
      label: {
        en: "Use case",
        ru: "Назначение",
      },
      value: {
        en: "Web preview / realtime asset",
        ru: "Web-превью / realtime-ассет",
      },
    },
  ],

  caption: {
    en: "The model is optimized for browser preview.",
    ru: "Модель оптимизирована для просмотра в браузере.",
  },
}
```

---

## 26.5. Минимальный вариант `model3d`

Если не нужны подписи и мета-информация:

```js
{
  type: "model3d",
  src: "/projects/new-project/models/model.glb",
  poster: "/projects/new-project/models/poster.jpg",
  alt: {
    en: "Interactive 3D model",
    ru: "Интерактивная 3D-модель",
  },
}
```

---

## 26.6. Рекомендации по подготовке моделей для сайта

```txt
[ ] Лучше использовать .glb
[ ] Названия файлов — латиницей, без пробелов
[ ] Желательно держать модель до 10–30 MB
[ ] Текстуры лучше оптимизировать
[ ] Не использовать слишком тяжёлые 4K/8K текстуры без необходимости
[ ] Проверить модель локально до публикации
[ ] Добавить poster.jpg, чтобы блок не выглядел пустым во время загрузки
[ ] Проверить модель в /en и /ru версиях страницы
```

Хорошие имена файлов:

```txt
robot-arm.glb
product-configurator.glb
scan-cleanup-preview.glb
```

Плохие имена файлов:

```txt
Робот рука финал.glb
model final final 2.glb
scan#preview.glb
```

---

## 26.7. Частые ошибки с 3D-моделями

### Модель не отображается

Проверь путь:

```js
src: "/projects/robot-arm/models/robot-arm.glb"
```

Файл должен лежать здесь:

```txt
public/projects/robot-arm/models/robot-arm.glb
```

После build он окажется здесь:

```txt
dist/projects/robot-arm/models/robot-arm.glb
```

---

### В консоли ошибка про неизвестный `model-viewer`

Проверь, что пакет установлен:

```bash
npm install @google/model-viewer
```

И что в `ProjectBlocks.jsx` есть импорт:

```js
import "@google/model-viewer";
```

---

### Модель слишком долго грузится

Возможные причины:

```txt
слишком тяжёлый .glb
слишком большие текстуры
нет poster.jpg
модель лежит на медленном хостинге
```

Что сделать:

```txt
оптимизировать геометрию
сжать текстуры
использовать .webp/.ktx2-текстуры, если пайплайн это поддерживает
уменьшить размер файла
положить тяжёлые модели на CDN/Object Storage
```

---

### Модель выглядит слишком тёмной или пересвеченной

Пробуй менять параметры блока:

```js
exposure: 1.2,
shadowIntensity: 0.6,
environmentImage: "neutral",
```

---

# Часть 4. Как добавлять проекты

---

## 27. Главный файл проектов

Файл:

```txt
src/data/projects.js
```

В нём должны быть:

```js
export const reusableProcess = [...];
export const projects = [...];
export const filters = [...];
export function getProject(slug) {...}
export function getNextProject(slug) {...}
```

Важно: не забывать `export`. Если забыть, будут ошибки вроде:

```txt
projects is not defined
The requested module does not provide an export named 'projects'
```

---

## 28. Минимальный bilingual-шаблон проекта

```js
{
  slug: "new-project",

  title: {
    en: "New Project",
    ru: "Новый проект",
  },

  typeKey: "cg-product",

  type: {
    en: "CG / Product",
    ru: "CG / Продукт",
  },

  year: "2026",

  client: {
    en: "Personal Study",
    ru: "Личный проект",
  },

  duration: "00:36",
  featured: false,
  ratio: "wide",
  accent: "from-stone-100 via-zinc-200 to-slate-300",
  shape: "box",

  description: {
    en: "Short description for cards and project lists.",
    ru: "Короткое описание для карточек и списка проектов.",
  },

  subtitle: {
    en: "Longer intro sentence for the project page.",
    ru: "Более развёрнутое вводное предложение для страницы проекта.",
  },

  tools: ["Blender", "Houdini", "Redshift"],

  cover: {
    type: "image",
    src: "/projects/new-project/cover.jpg",
    alt: {
      en: "New Project cover image",
      ru: "Обложка проекта Новый проект",
    },
  },

  hero: {
    type: "image",
    src: "/projects/new-project/hero.jpg",
    alt: {
      en: "New Project hero image",
      ru: "Главное изображение проекта Новый проект",
    },
  },

  blocks: [
    {
      type: "text",
      label: {
        en: "Project note",
        ru: "О проекте",
      },
      columns: [
        {
          en: "First paragraph.",
          ru: "Первый абзац.",
        },
        {
          en: "Second paragraph.",
          ru: "Второй абзац.",
        },
      ],
    },
    {
      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/new-project/01.jpg",
          alt: {
            en: "Detail image 1",
            ru: "Детальное изображение 1",
          },
        },
        {
          type: "image",
          src: "/projects/new-project/02.jpg",
          alt: {
            en: "Detail image 2",
            ru: "Детальное изображение 2",
          },
        },
      ],
    },
    {
      type: "process",
      items: reusableProcess,
    },
  ],
}
```

---

## 29. Поля проекта

### `slug`

```js
slug: "synthetic-plant"
```

Используется в URL:

```txt
/en/work/synthetic-plant
/ru/work/synthetic-plant
```

Правила:

```txt
только латиница
маленькие буквы
слова через дефис
без пробелов
без кириллицы
без спецсимволов
```

Хорошо:

```txt
scan-cleanup
retail-object
procedural-pencil
```

Плохо:

```txt
Scan Cleanup
скан-модель
scan_cleanup!!!
```

---

### `title`

```js
title: {
  en: "Synthetic Plant",
  ru: "Синтетическое растение",
}
```

Показывается:

```txt
на карточке
в списке проектов
на странице проекта
в блоке Next project
```

---

### `typeKey`

```js
typeKey: "generative"
```

Это стабильный технический ключ для фильтров.

Он не переводится.

Лучше писать:

```txt
cg-product
animation
shader-rd
brand-visual
simulation
system-design
generative
pipeline
lookdev
database
interface
```

---

### `type`

```js
type: {
  en: "Generative",
  ru: "Генеративная графика",
}
```

Это отображаемое название типа проекта.

Показывается:

```txt
на карточке
в фильтрах
в мета-информации проекта
```

---

### `year`

```js
year: "2026"
```

Показывается на странице проекта.

---

### `client`

```js
client: {
  en: "Personal Study",
  ru: "Личный проект",
}
```

Можно писать нейтрально:

```txt
Personal Study / Личный проект
Internal R&D / Внутренний R&D
Commercial Concept / Коммерческий концепт
NDA Project / NDA-проект
```

---

### `duration`

```js
duration: "00:21"
```

Используется на странице `/work` как визуальный таймкод.

Это не обязательно реальная длительность.

---

### `featured`

```js
featured: true
```

Первый проект с `featured: true` используется как featured-проект на странице `/work`.

---

### `ratio`

```js
ratio: "wide"
```

Определяет размер карточки на главной.

Поддерживаемые значения:

```txt
wide
portrait
square
```

---

### `accent`

```js
accent: "from-green-100 via-lime-200 to-yellow-100"
```

Используется для placeholder-градиента.

Даже если у проекта есть реальные картинки, `accent` полезен как fallback.

---

### `shape`

```js
shape: "plant"
```

Используется для placeholder-графики.

---

### `description`

```js
description: {
  en: "Procedural leaves, staged botanical forms and calm synthetic gardening.",
  ru: "Процедурные листья, постановочные ботанические формы и спокойная синтетическая ботаника.",
}
```

Короткое описание.

Используется:

```txt
на карточке
на странице /work
в блоке Next project
```

Лучше держать в 1 предложение.

---

### `subtitle`

```js
subtitle: {
  en: "A generative botanical study built as if it were a small product collection.",
  ru: "Генеративное ботаническое исследование, собранное как небольшая продуктовая коллекция.",
}
```

Показывается в верхней части страницы проекта.

---

### `tools`

```js
tools: ["Cinema 4D", "Houdini", "Octane"]
```

Можно оставить строками, если названия инструментов одинаковы для обоих языков.

Если нужен перевод, можно использовать объекты:

```js
tools: [
  "Houdini",
  {
    en: "Procedural Modeling",
    ru: "Процедурное моделирование",
  },
]
```

Выводить нужно через:

```js
getText(tool, locale)
```

---

# Часть 5. Фильтры проектов

---

## 30. Как строятся фильтры

Фильтры лучше строить по `typeKey`, а отображать через `type`.

Пример:

```js
export const filters = [
  {
    key: "all",
    label: {
      en: "All",
      ru: "Все",
    },
  },
  ...Array.from(
    new Map(
      projects.map((project) => [
        project.typeKey,
        {
          key: project.typeKey,
          label: project.type,
        },
      ])
    ).values()
  ),
];
```

В `HomePage.jsx` активный фильтр должен хранить key:

```js
const [active, setActive] = useState("all");
```

Фильтрация:

```js
const visibleProjects = useMemo(() => {
  if (active === "all") return projects;
  return projects.filter((project) => project.typeKey === active);
}, [active]);
```

Вывод label:

```jsx
{getText(filter.label, locale)}
```

---

# Часть 6. Блоки страницы проекта

---

## 31. Как устроены blocks

Страница проекта собирается из массива:

```js
blocks: [
  {...},
  {...},
  {...},
]
```

Каждый объект — один блок страницы.

Порядок объектов = порядок блоков на странице.

Рендеринг происходит в:

```txt
src/components/projects/ProjectBlocks.jsx
```

---

## 32. Блок `text`

Текстовый блок.

```js
{
  type: "text",
  label: {
    en: "Project note",
    ru: "О проекте",
  },
  columns: [
    {
      en: "First text column.",
      ru: "Первый текстовый столбец.",
    },
    {
      en: "Second text column.",
      ru: "Второй текстовый столбец.",
    },
  ],
}
```

Где использовать:

```txt
описание идеи
контекст проекта
короткая история
техническое пояснение
```

---

## 33. Блок `media`

Один большой визуальный блок.

```js
{
  type: "media",
  media: {
    type: "image",
    src: "/projects/new-project/01.jpg",
    alt: {
      en: "Large project image",
      ru: "Большое изображение проекта",
    },
  },
  size: "large",
  caption: {
    en: "Optional caption",
    ru: "Необязательная подпись",
  },
}
```

`size: "large"` делает блок выше.

---

## 34. Блок `mediaGrid`

Сетка из двух медиа-блоков.

```js
{
  type: "mediaGrid",
  items: [
    {
      type: "image",
      src: "/projects/new-project/01.jpg",
      alt: {
        en: "Detail 1",
        ru: "Деталь 1",
      },
    },
    {
      type: "video",
      src: "/projects/new-project/detail-loop.mp4",
      poster: "/projects/new-project/02.jpg",
    },
  ],
}
```

Можно смешивать изображения и видео.

---

## 35. Блок `process`

Блок процесса.

Можно использовать общий процесс:

```js
{
  type: "process",
  items: reusableProcess,
}
```

Или индивидуальный:

```js
{
  type: "process",
  items: [
    {
      title: {
        en: "Research",
        ru: "Исследование",
      },
      text: {
        en: "Collected references, constraints and input files.",
        ru: "Собрал референсы, ограничения и входные файлы.",
      },
    },
    {
      title: {
        en: "Build",
        ru: "Сборка",
      },
      text: {
        en: "Created procedural setup and visual system.",
        ru: "Собрал процедурную систему и визуальные правила.",
      },
    },
    {
      title: {
        en: "Delivery",
        ru: "Результат",
      },
      text: {
        en: "Rendered final visuals and prepared reusable assets.",
        ru: "Подготовил финальные визуалы и переиспользуемые ассеты.",
      },
    },
  ],
}
```

---

## 36. Блок `quote`

Крупная цитата или statement.

```js
{
  type: "quote",
  text: {
    en: "A project page should be flexible enough for a long case study, but simple enough for a one-evening upload.",
    ru: "Страница проекта должна быть достаточно гибкой для большого кейса и достаточно простой для вечерней загрузки материалов.",
  },
}
```

---

## 37. Блок `credits`

Блок ролей, задач и outputs.

```js
{
  type: "credits",
  items: [
    {
      label: {
        en: "Role",
        ru: "Роль",
      },
      value: {
        en: "3D direction, lookdev, render system",
        ru: "3D-дирекшн, lookdev, система рендера",
      },
    },
    {
      label: {
        en: "Output",
        ru: "Результат",
      },
      value: {
        en: "Hero images, crops, presentation visuals",
        ru: "Hero-изображения, кропы, презентационные визуалы",
      },
    },
  ],
}
```

---

# Часть 7. Добавление новых типов блоков

---

## 38. Где находится renderer блоков

Файл:

```txt
src/components/projects/ProjectBlocks.jsx
```

Внизу есть функция:

```jsx
export default function ProjectBlocks({ project }) {
  return project.blocks?.map((block, index) => {
    if (block.type === "text") return <TextBlock key={index} block={block} />;
    if (block.type === "media") return <MediaBlock key={index} block={block} project={project} />;
    if (block.type === "mediaGrid") return <MediaGridBlock key={index} block={block} project={project} />;
    if (block.type === "process") return <ProcessBlock key={index} block={block} />;
    if (block.type === "quote") return <QuoteBlock key={index} block={block} />;
    if (block.type === "credits") return <CreditsBlock key={index} block={block} />;
    return null;
  });
}
```

Чтобы добавить новый тип блока:

```txt
1. Создать новую функцию блока в ProjectBlocks.jsx
2. Использовать getText() внутри всех текстовых полей
3. Добавить условие в ProjectBlocks
4. Использовать новый type в projects.js
```

---

## 39. Пример нового блока `twoColumnTextMedia`

Добавить в `ProjectBlocks.jsx`:

```jsx
function TwoColumnTextMediaBlock({ block, project }) {
  const locale = useLocale();

  return (
    <section className="mx-auto grid max-w-[1600px] gap-5 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {getText(block.label, locale)}
        </p>

        <h2 className="mb-6 text-4xl font-black tracking-[-0.05em] md:text-6xl">
          {getText(block.title, locale)}
        </h2>

        <p className="text-lg leading-relaxed text-zinc-700">
          {getText(block.text, locale)}
        </p>
      </div>

      <ProjectMedia media={block.media} project={project} className="min-h-[520px]" />
    </section>
  );
}
```

Добавить в renderer:

```jsx
if (block.type === "twoColumnTextMedia") {
  return <TwoColumnTextMediaBlock key={index} block={block} project={project} />;
}
```

Использовать в `projects.js`:

```js
{
  type: "twoColumnTextMedia",
  label: {
    en: "Technical note",
    ru: "Техническая заметка",
  },
  title: {
    en: "Geometry cleanup",
    ru: "Очистка геометрии",
  },
  text: {
    en: "The original input geometry was reorganized, renamed and optimized for downstream production.",
    ru: "Исходная геометрия была переорганизована, переименована и оптимизирована для дальнейшего производства.",
  },
  media: {
    type: "image",
    src: "/projects/robot-arm/process-01.jpg",
    alt: {
      en: "Geometry cleanup process",
      ru: "Процесс очистки геометрии",
    },
  },
}
```

---

# Часть 8. Полный пример нового проекта

---

## 40. Создать папку

```txt
public/projects/robot-arm/
```

Положить файлы:

```txt
cover.jpg
hero.mp4
01.jpg
02.jpg
03.jpg
```

---

## 41. Добавить объект в `projects.js`

```js
{
  slug: "robot-arm",

  title: {
    en: "Robot Arm",
    ru: "Роботизированная рука",
  },

  typeKey: "pipeline",

  type: {
    en: "Pipeline",
    ru: "Пайплайн",
  },

  year: "2026",

  client: {
    en: "Internal R&D",
    ru: "Внутренний R&D",
  },

  duration: "00:36",
  featured: false,
  ratio: "wide",
  accent: "from-stone-100 via-zinc-200 to-slate-300",
  shape: "scan",

  description: {
    en: "Pipeline for preparing robotic arm assets for real-time and presentation use.",
    ru: "Пайплайн подготовки ассетов роботизированной руки для realtime и презентационных задач.",
  },

  subtitle: {
    en: "From technical input geometry to optimized visual production assets.",
    ru: "От технической входной геометрии к оптимизированным визуальным ассетам.",
  },

  tools: ["Blender", "Houdini", "Python", "Unity"],

  cover: {
    type: "image",
    src: "/projects/robot-arm/cover.jpg",
    alt: {
      en: "Robot Arm cover image",
      ru: "Обложка проекта Роботизированная рука",
    },
  },

  hero: {
    type: "video",
    src: "/projects/robot-arm/hero.mp4",
    poster: "/projects/robot-arm/cover.jpg",
  },

  blocks: [
    {
      type: "text",
      label: {
        en: "Project note",
        ru: "О проекте",
      },
      columns: [
        {
          en: "The project started from a technical model that needed to become presentation-ready.",
          ru: "Проект начался с технической модели, которую нужно было довести до презентационного качества.",
        },
        {
          en: "The final system included cleaned geometry, material setup and optimized outputs.",
          ru: "Финальная система включала очищенную геометрию, настройку материалов и оптимизированные выходные файлы.",
        },
      ],
    },
    {
      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/robot-arm/01.jpg",
          alt: {
            en: "Robot Arm process image",
            ru: "Процесс работы над роботизированной рукой",
          },
        },
        {
          type: "image",
          src: "/projects/robot-arm/02.jpg",
          alt: {
            en: "Robot Arm final render",
            ru: "Финальный рендер роботизированной руки",
          },
        },
      ],
    },
    {
      type: "media",
      media: {
        type: "image",
        src: "/projects/robot-arm/03.jpg",
        alt: {
          en: "Robot Arm detail render",
          ru: "Детальный рендер роботизированной руки",
        },
      },
      size: "large",
      caption: {
        en: "Detail view of the optimized asset.",
        ru: "Детальный вид оптимизированного ассета.",
      },
    },
    {
      type: "process",
      items: [
        {
          title: {
            en: "Input",
            ru: "Входные данные",
          },
          text: {
            en: "Technical model, references and target platform constraints.",
            ru: "Техническая модель, референсы и ограничения целевой платформы.",
          },
        },
        {
          title: {
            en: "Cleanup",
            ru: "Очистка",
          },
          text: {
            en: "Geometry cleanup, hierarchy, naming and material preparation.",
            ru: "Очистка геометрии, иерархия, нейминг и подготовка материалов.",
          },
        },
        {
          title: {
            en: "Output",
            ru: "Результат",
          },
          text: {
            en: "Presentation renders and optimized realtime-ready assets.",
            ru: "Презентационные рендеры и оптимизированные realtime-ready ассеты.",
          },
        },
      ],
    },
    {
      type: "credits",
      items: [
        {
          label: {
            en: "Role",
            ru: "Роль",
          },
          value: {
            en: "Pipeline, optimization, lookdev",
            ru: "Пайплайн, оптимизация, lookdev",
          },
        },
        {
          label: {
            en: "Output",
            ru: "Результат",
          },
          value: {
            en: "Realtime asset, renders, documentation",
            ru: "Realtime-ассет, рендеры, документация",
          },
        },
      ],
    },
  ],
}
```

После этого проект будет доступен:

```txt
/en/work/robot-arm
/ru/work/robot-arm
```

---

# Часть 9. Контентные рекомендации

---

## 42. Хороший порядок блоков

Для простого кейса:

```txt
hero
text
mediaGrid
process
credits
next project
```

Для визуального кейса:

```txt
hero video
text
large media
mediaGrid
quote
credits
next project
```

Для технического кейса:

```txt
hero
text
process
mediaGrid
large media
credits
next project
```

---

## 43. Сколько текста писать

Для портфолио обычно хорошо работает:

```txt
короткий subtitle
1–2 текстовых блока
2–6 визуальных блоков
короткий process
чёткие credits
```

Принцип:

```txt
visual first, explanation second
```

---

## 44. Как оформлять NDA-кейсы

Можно не раскрывать клиента и детали.

Используй нейтральные формулировки:

```js
client: {
  en: "NDA Project",
  ru: "NDA-проект",
}
```

```js
description: {
  en: "A production pipeline for preparing complex 3D assets for interactive use.",
  ru: "Производственный пайплайн подготовки сложных 3D-ассетов для интерактивного использования.",
}
```

Показывай:

```txt
метод
тип задачи
визуальный результат
роль
формат output
```

Не показывай:

```txt
закрытые названия клиента
внутренние документы
чувствительные файлы
непубличные интерфейсы
```

---

# Часть 10. Проверка перед публикацией

---

## 45. Чеклист перед commit

```txt
[ ] npm run dev работает
[ ] / редиректит на /en или открывается корректно
[ ] /en открывается
[ ] /ru открывается
[ ] /en/work открывается
[ ] /ru/work открывается
[ ] /en/work/project-slug открывается
[ ] /ru/work/project-slug открывается
[ ] переключатель EN/RU сохраняет текущую страницу
[ ] все картинки загружаются
[ ] видео autoplay работает там, где нужно
[ ] в консоли нет красных ошибок
[ ] slug совпадает с папкой проекта
[ ] пути к медиа начинаются с /projects/
[ ] у проекта есть typeKey
[ ] title / type / description / subtitle переведены или хотя бы не ломают getText()
[ ] project object закрыт запятой
[ ] массив projects не сломан
[ ] npm run build проходит без ошибок
```

---

## 46. Команды

Локальная разработка:

```bash
npm run dev
```

Production build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Commit:

```bash
git add .
git commit -m "Add new portfolio project"
git push
```

---

# Часть 11. Частые ошибки

---

## 47. Белая или пустая страница

Открой консоль браузера:

```txt
F12 → Console
```

Частые причины:

```txt
не экспортирован projects
не импортирован ProjectMedia
ошибка в пути импорта
забыли закрыть объект проекта запятой
забыли закрыть массив blocks
сломана JSX-разметка
BrowserRouter случайно продублирован
```

---

## 48. `ProjectMedia is not defined`

В файле:

```txt
src/components/projects/ProjectBlocks.jsx
```

должен быть импорт:

```js
import ProjectMedia from "../media/ProjectMedia";
```

---

## 49. `projects is not defined`

В файле, где используется `projects`, должен быть импорт:

```js
import { projects } from "../data/projects";
```

Путь зависит от расположения файла.

---

## 50. `getText is not defined`

Добавь импорт:

```js
import { getText } from "../i18n/config";
```

Или, если файл лежит глубже:

```js
import { getText } from "../../i18n/config";
```

Пример:

```txt
src/components/projects/ProjectCard.jsx
```

Для него путь будет:

```js
import { getText } from "../../i18n/config";
```

---

## 51. `useLocale is not defined`

Добавь импорт:

```js
import { useLocale } from "../i18n/useLocale";
```

Или для компонента внутри `components/projects`:

```js
import { useLocale } from "../../i18n/useLocale";
```

---

## 52. Картинка не отображается

Проверь путь.

Файл:

```txt
public/projects/robot-arm/cover.jpg
```

В коде:

```js
src: "/projects/robot-arm/cover.jpg"
```

Не так:

```js
src: "public/projects/robot-arm/cover.jpg"
```

И не так:

```js
src: "/public/projects/robot-arm/cover.jpg"
```

---

## 53. Страница проекта перекидывает на `/work` или `/en/work`

Значит проект не найден по `slug`.

Проверь URL:

```txt
/en/work/robot-arm
```

И поле в объекте:

```js
slug: "robot-arm"
```

Они должны совпадать.

---

## 54. Фильтр не работает

Проверь, что у проекта есть:

```js
typeKey: "pipeline"
```

И что фильтрация идёт по `typeKey`, а не по `type`:

```js
project.typeKey === active
```

`type` теперь переводимый объект, поэтому использовать его как технический ключ не нужно.

---

## 55. Переключатель языка ведёт не туда

Проверь функцию:

```js
switchLocaleInPath(location.pathname, localeKey)
```

Она должна заменять первый сегмент URL:

```txt
/en/work/project → /ru/work/project
/ru/about → /en/about
```

Если текущий путь без языка, можно редиректить на `DEFAULT_LOCALE`.

---

## 56. Карточки накладываются друг на друга

Проверь две вещи.

### 1. `ratio` должен быть на корневом элементе карточки

Хорошо:

```jsx
<Link className={`group relative block ... ${ratio}`}>
```

Плохо:

```jsx
<Link>
  <article className={ratio}>...</article>
</Link>
```

### 2. Grid должен учитывать row-span

В `HomePage.jsx`:

```jsx
<div className="grid grid-cols-1 gap-5 md:auto-rows-[180px] md:grid-cols-3 xl:grid-cols-4">
```

А в `ProjectCard.jsx`:

```js
const ratio =
  project.ratio === "portrait"
    ? "md:row-span-3 min-h-[520px]"
    : project.ratio === "wide"
      ? "md:col-span-2 md:row-span-2 min-h-[360px]"
      : "md:row-span-2 min-h-[360px]";
```

---

# Часть 12. Главные правила поддержки

---

## 57. Что редактировать в разных случаях

Если меняется конкретный кейс:

```txt
src/data/projects.js
public/projects/project-slug/
```

Если меняется текст сайта, email, соцсети:

```txt
src/data/site.js
```

Если меняется перевод кнопок и интерфейса:

```txt
src/i18n/config.js
```

Если меняется внешний вид всех страниц проектов:

```txt
src/pages/ProjectPage.jsx
src/components/projects/ProjectBlocks.jsx
```

Если меняется карточка проекта:

```txt
src/components/projects/ProjectCard.jsx
```

Если меняется логика image/video:

```txt
src/components/media/ProjectMedia.jsx
```

Если добавляется новый тип блока:

```txt
src/components/projects/ProjectBlocks.jsx
```

---

## 58. Главное правило

```txt
Контент кейса — в projects.js.
Медиа кейса — в public/projects/slug/.
Дизайн — в компонентах.
Переводы интерфейса — в i18n/config.js.
```

Не нужно создавать отдельную страницу под каждый проект.

Не нужно дублировать русскую и английскую версии проекта.

Один проект = один объект данных + bilingual-поля.

---

## 59. Финальный пайплайн добавления проекта

```txt
1. Придумать slug
2. Создать public/projects/slug/
3. Подготовить cover.jpg
4. Подготовить hero.jpg или hero.mp4
5. Добавить дополнительные изображения 01.jpg, 02.jpg, 03.jpg
6. Скопировать минимальный bilingual-шаблон проекта
7. Вставить объект в src/data/projects.js
8. Заполнить title en/ru
9. Заполнить typeKey и type en/ru
10. Заполнить year, client, duration, ratio
11. Настроить cover и hero
12. Собрать blocks
13. Проверить /en/work/slug
14. Проверить /ru/work/slug
15. Проверить главную /en и /ru
16. Проверить /en/work и /ru/work
17. Запустить npm run build
18. Commit / push
```

