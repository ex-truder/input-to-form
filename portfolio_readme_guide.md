# Portfolio Engine Guide

Гайд по поддержке статического портфолио-сайта на **React + Vite + Tailwind**.

Сайт устроен как маленький **portfolio engine без CMS**: дизайн и шаблоны живут в компонентах, а кейсы добавляются через данные и медиа-файлы.

---

## 1. Главная идея

Не нужно вручную верстать отдельную страницу под каждый кейс.

Правильный процесс:

```txt
1. Создать папку проекта в public/projects/
2. Положить туда изображения и видео
3. Добавить один объект проекта в src/data/projects.js
4. Описать страницу проекта через blocks
5. Проверить локально
6. Сделать commit / push
```

После добавления объекта в `projects.js` проект автоматически появляется:

```txt
/                 главная страница
/work             список проектов
/work/project-id  отдельная страница проекта
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

---

## 3. Как запускать проект локально

```bash
npm install
npm run dev
```

Обычно сайт откроется по адресу:

```txt
http://localhost:5173/
```

Проверить production-сборку:

```bash
npm run build
npm run preview
```

---

# Часть 1. Как вносить изменения в дизайн и блоки

---

## 4. Где менять общие настройки сайта

Файл:

```txt
src/data/site.js
```

Там должны лежать базовые настройки:

```js
export const site = {
  title: "Input to Form",
  email: "hello@example.com",
  description:
    "Procedural 3D, product visuals, simulations, asset pipelines and interactive visual systems.",
  socials: [
    { label: "Instagram", href: "#" },
    { label: "LinkedIn", href: "#" },
    { label: "Behance", href: "#" },
  ],
};
```

Менять здесь:

```txt
название сайта
email
описание в футере
ссылки на соцсети
```

---

## 5. Где менять глобальный стиль

Файл:

```txt
src/index.css
```

Здесь подключается Tailwind:

```css
@import "tailwindcss";

html {
  scroll-behavior: smooth;
}

body {
  margin: 0;
}
```

Сюда можно добавлять глобальные правила, например:

```css
body {
  margin: 0;
  background: #f6f3ec;
}
```

Но большую часть дизайна лучше менять не здесь, а прямо в компонентах через Tailwind-классы.

---

## 6. Где менять фон, цветовую схему и общий layout

Файл:

```txt
src/App.jsx
```

Основной wrapper выглядит примерно так:

```jsx
<main className="min-h-screen bg-[#f6f3ec] text-zinc-950 selection:bg-zinc-950 selection:text-white">
  <Header />
  <Routes>...</Routes>
  <Footer />
</main>
```

Чтобы изменить фон всего сайта:

```jsx
bg-[#f6f3ec]
```

Например:

```jsx
bg-white
```

или:

```jsx
bg-[#111111] text-white
```

Чтобы изменить максимальную ширину всего сайта, ищи классы:

```txt
max-w-[1600px]
```

Например можно заменить на:

```txt
max-w-[1440px]
```

или:

```txt
max-w-[1800px]
```

---

## 7. Где менять Header

Файл:

```txt
src/components/layout/Header.jsx
```

Здесь находятся:

```txt
логотип / название
навигация
email в хедере
мобильная ссылка Work
```

Пример:

```jsx
<Link to="/" className="text-lg font-black tracking-tight normal-case">
  {site.title}
</Link>
```

Чтобы изменить пункты меню, меняй этот блок:

```jsx
<div className="hidden items-center gap-6 md:flex">
  <NavLink to="/work" className={navLinkClass}>
    Work
  </NavLink>

  <NavLink to="/" className={navLinkClass}>
    3D
  </NavLink>

  <a href={`mailto:${site.email}`} className="normal-case hover:opacity-50">
    {site.email}
  </a>

  <NavLink to="/about" className={navLinkClass}>
    About
  </NavLink>
</div>
```

---

## 8. Где менять Footer

Файл:

```txt
src/components/layout/Footer.jsx
```

Footer берёт данные из:

```txt
src/data/site.js
```

Если нужно изменить только email или соцсети — лучше менять `site.js`.

Если нужно изменить сам внешний вид футера — менять `Footer.jsx`.

---

## 9. Где менять главную страницу

Файл:

```txt
src/pages/HomePage.jsx
```

Здесь находятся:

```txt
hero-заголовок
короткое описание
кнопки View projects / Contact
фильтры проектов
главная сетка карточек
нижний текстовый блок From input to form
```

Главный заголовок:

```jsx
<h1 className="max-w-5xl text-[16vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[9.4vw]">
  I&apos;d like this to be my 3D CV
</h1>
```

Чтобы поменять текст — меняй содержимое `h1`.

Чтобы поменять размер — меняй классы:

```txt
text-[16vw]
md:text-[9.4vw]
```

---

## 10. Где менять страницу списка проектов `/work`

Файл:

```txt
src/pages/WorkIndexPage.jsx
```

Здесь находятся:

```txt
заголовок I love 3D
описание страницы
featured-блок
список Go to Projects
NDA-friendly блок
```

Featured-проект сейчас выбирается автоматически:

```js
const featuredProject = projects.find((project) => project.featured) || projects[0];
```

Это значит: берётся первый проект, у которого:

```js
featured: true
```

Если таких проектов несколько, будет выбран первый из списка.

---

## 11. Где менять страницу одного проекта `/work/:slug`

Файл:

```txt
src/pages/ProjectPage.jsx
```

Здесь находится общий шаблон страницы проекта:

```txt
Back to work
мета проекта: type / year / client
title
subtitle
tool tags
hero media
blocks
next project
```

Важно: сюда обычно не нужно лезть при добавлении нового кейса.

Сюда лезем только если нужно изменить структуру всех страниц проектов сразу.

Например:

```txt
добавить client-logo в hero всех проектов
поменять расположение title/subtitle
изменить стиль tool-tags
убрать блок Next project
```

---

## 12. Где менять карточку проекта

Файл:

```txt
src/components/projects/ProjectCard.jsx
```

Карточка используется на главной странице.

Здесь настраиваются:

```txt
размер карточки
hover-состояние
название проекта на карточке
тип проекта
кнопка Open
```

Размер карточки зависит от поля `ratio` в проекте:

```js
ratio: "portrait"
ratio: "wide"
ratio: "square"
```

Логика:

```jsx
const ratio =
  project.ratio === "portrait"
    ? "md:row-span-2 min-h-[520px]"
    : project.ratio === "wide"
      ? "md:col-span-2 min-h-[360px]"
      : "min-h-[360px]";
```

---

## 13. Где менять отображение картинок и видео

Файл:

```txt
src/components/media/ProjectMedia.jsx
```

Этот компонент отвечает за:

```txt
image
video
fallback на placeholder
ошибку загрузки медиа
object-cover
скругление
```

Если картинка не загрузилась, автоматически показывается placeholder.

Поддерживаемые типы media:

```js
{ type: "image", src: "..." }
{ type: "video", src: "..." }
{ type: "placeholder" }
```

---

## 14. Где менять placeholder-графику

Файлы:

```txt
src/components/media/PlaceholderVisual.jsx
src/components/media/Shape.jsx
```

`PlaceholderVisual.jsx` отвечает за фон и градиент.

`Shape.jsx` отвечает за декоративную фигуру внутри placeholder.

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

Placeholder нужен для:

```txt
быстрого прототипирования
проектов без готовых картинок
безопасного fallback, если путь к файлу неправильный
```

---

# Часть 2. Как добавлять проекты и оформлять страницы по блокам

---

## 15. Основной файл для добавления кейсов

Файл:

```txt
src/data/projects.js
```

Если у тебя файл называется `projects.jsx`, это тоже ок, но для данных лучше использовать `.js`.

В этом файле должны быть:

```js
export const reusableProcess = [...];
export const projects = [...];
export const filters = [...];
export function getProject(slug) {...}
export function getNextProject(slug) {...}
```

Самое важное — массив:

```js
export const projects = [
  {...},
  {...},
  {...},
];
```

Каждый объект внутри массива — один проект.

---

## 16. Минимальный шаблон проекта

```js
{
  slug: "new-project",
  title: "New Project",
  type: "CG / Product",
  year: "2026",
  client: "Personal Study",
  duration: "00:36",
  featured: false,
  ratio: "wide",
  accent: "from-stone-100 via-zinc-200 to-slate-300",
  shape: "box",

  description: "Short description for cards and project lists.",
  subtitle: "Longer intro sentence for the project page.",

  tools: ["Blender", "Houdini", "Redshift"],

  cover: {
    type: "image",
    src: "/projects/new-project/cover.jpg",
    alt: "New Project cover image",
  },

  hero: {
    type: "image",
    src: "/projects/new-project/hero.jpg",
    alt: "New Project hero image",
  },

  blocks: [
    {
      type: "text",
      label: "Project note",
      columns: [
        "First paragraph.",
        "Second paragraph."
      ],
    },
    {
      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/new-project/01.jpg",
          alt: "Detail image 1",
        },
        {
          type: "image",
          src: "/projects/new-project/02.jpg",
          alt: "Detail image 2",
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

## 17. Что означает каждое поле проекта

### `slug`

```js
slug: "synthetic-plant"
```

Используется в URL:

```txt
/work/synthetic-plant
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
title: "Synthetic Plant"
```

Показывается:

```txt
на карточке
в списке проектов
на странице проекта
в блоке Next project
```

---

### `type`

```js
type: "Generative"
```

Используется:

```txt
в карточках
в фильтрах на главной
в мета-информации проекта
```

Фильтры создаются автоматически из всех уникальных `type`.

Если добавишь новый type:

```js
type: "AR / VR"
```

то на главной автоматически появится фильтр `AR / VR`.

---

### `year`

```js
year: "2026"
```

Показывается на странице проекта в строке:

```txt
TYPE / YEAR / CLIENT
```

---

### `client`

```js
client: "Personal Study"
```

Можно писать:

```txt
Personal Study
Internal R&D
Commercial Concept
Client Name
NDA Project
```

Если не хочешь раскрывать клиента, используй нейтральное название.

---

### `duration`

```js
duration: "00:21"
```

Используется на странице `/work` в списке проектов, визуально как таймкод.

Это не обязательно реальная длительность. Можно использовать как декоративную навигационную метку.

---

### `featured`

```js
featured: true
```

Проект с `featured: true` может использоваться как главный проект на странице `/work`.

Если таких проектов несколько, будет выбран первый из списка.

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

`wide` — широкая карточка.

`portrait` — высокая карточка.

`square` — обычная карточка.

---

### `accent`

```js
accent: "from-green-100 via-lime-200 to-yellow-100"
```

Используется для placeholder-градиента, если нет реального изображения.

Это Tailwind-классы градиента.

Примеры:

```js
accent: "from-slate-200 via-zinc-300 to-stone-400"
accent: "from-cyan-100 via-blue-200 to-violet-200"
accent: "from-rose-100 via-red-200 to-orange-200"
```

Если у проекта есть реальные картинки, `accent` всё равно полезен как fallback.

---

### `shape`

```js
shape: "plant"
```

Используется только для placeholder-графики.

Поддерживаемые значения:

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

### `description`

```js
description: "Procedural leaves, staged botanical forms and calm synthetic gardening."
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
subtitle: "A generative botanical study built as if it were a small product collection."
```

Показывается в верхней части страницы проекта.

Можно сделать чуть длиннее, чем `description`, но не превращать в большой абзац.

---

### `tools`

```js
tools: ["Cinema 4D", "Houdini", "Octane"]
```

Показывается как теги на странице проекта.

Можно добавлять:

```txt
Blender
Houdini
Cinema 4D
Redshift
Octane
Unity
Unreal
Python
Figma
Spline
Photogrammetry
Simulation
Lookdev
Pipeline
```

---

## 18. Как хранить медиа проекта

Для каждого проекта создавай отдельную папку:

```txt
public/projects/project-slug/
```

Например:

```txt
public/projects/synthetic-plant/
```

Рекомендуемый набор файлов:

```txt
cover.jpg      карточка на главной и /work
hero.jpg       главный визуал страницы проекта
hero.mp4       если hero — видео
01.jpg         первый дополнительный визуал
02.jpg         второй дополнительный визуал
03.jpg         третий дополнительный визуал
process-01.jpg
result-01.mp4
```

Путь в коде всегда начинается с `/projects/...`, без `public`:

```js
src: "/projects/synthetic-plant/cover.jpg"
```

Не писать так:

```js
src: "/public/projects/synthetic-plant/cover.jpg"
```

---

## 19. Формат изображения

Для картинок:

```js
{
  type: "image",
  src: "/projects/new-project/cover.jpg",
  alt: "Description of the image"
}
```

Поддерживаются обычные web-форматы:

```txt
.jpg
.jpeg
.png
.webp
.avif
```

Рекомендации:

```txt
cover.jpg — 1600–2400 px по ширине
hero.jpg — 2400–3200 px по ширине
дополнительные изображения — 1600–2400 px по ширине
```

Для сайта лучше использовать `.jpg`, `.webp` или `.avif`.

---

## 20. Формат видео

Для видео:

```js
{
  type: "video",
  src: "/projects/new-project/hero.mp4",
  poster: "/projects/new-project/cover.jpg"
}
```

По умолчанию видео:

```txt
autoplay
muted
loop
playsInline
controls = false
```

Можно явно задать:

```js
{
  type: "video",
  src: "/projects/new-project/hero.mp4",
  poster: "/projects/new-project/cover.jpg",
  autoPlay: true,
  muted: true,
  loop: true,
  controls: false
}
```

Если нужен обычный плеер с контролами:

```js
controls: true
```

---

## 21. Placeholder вместо медиа

Если картинок ещё нет, можно использовать placeholder:

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
    shape: "console"
  },
  size: "large"
}
```

Можно задать отдельный shape:

```js
{ type: "placeholder", shape: "plant" }
```

И отдельный accent:

```js
{
  type: "placeholder",
  shape: "box",
  accent: "from-fuchsia-100 via-purple-200 to-indigo-200"
}
```

---

# Часть 3. Блоки страницы проекта

Страница проекта собирается из массива:

```js
blocks: [
  {...},
  {...},
  {...},
]
```

Каждый объект внутри `blocks` — отдельный блок страницы.

Порядок объектов = порядок блоков на странице.

---

## 22. Блок `text`

Текстовый блок в две колонки.

```js
{
  type: "text",
  label: "Project note",
  columns: [
    "First text column.",
    "Second text column."
  ]
}
```

Где использовать:

```txt
описание идеи
контекст проекта
короткая история
техническое пояснение
```

Можно делать одну колонку:

```js
{
  type: "text",
  label: "Context",
  columns: [
    "Single paragraph text."
  ]
}
```

Но визуально лучше работают две колонки.

---

## 23. Блок `media`

Один большой визуальный блок.

```js
{
  type: "media",
  media: {
    type: "image",
    src: "/projects/new-project/01.jpg",
    alt: "Large project image"
  },
  size: "large",
  caption: "Optional caption"
}
```

`size` может быть:

```txt
large
обычное значение можно не указывать
```

Если `size: "large"`, блок будет выше:

```txt
min-h-[72vh]
```

Без `large`:

```txt
min-h-[520px]
```

---

## 24. Блок `mediaGrid`

Сетка из двух медиа-блоков.

```js
{
  type: "mediaGrid",
  items: [
    {
      type: "image",
      src: "/projects/new-project/01.jpg",
      alt: "Detail 1"
    },
    {
      type: "image",
      src: "/projects/new-project/02.jpg",
      alt: "Detail 2"
    }
  ]
}
```

Можно смешивать image и video:

```js
{
  type: "mediaGrid",
  items: [
    {
      type: "image",
      src: "/projects/new-project/01.jpg",
      alt: "Still frame"
    },
    {
      type: "video",
      src: "/projects/new-project/detail-loop.mp4",
      poster: "/projects/new-project/02.jpg"
    }
  ]
}
```

---

## 25. Блок `process`

Блок процесса.

Можно использовать общий процесс:

```js
{
  type: "process",
  items: reusableProcess
}
```

Или задать индивидуальный:

```js
{
  type: "process",
  items: [
    {
      title: "Research",
      text: "Collected references, constraints and input files."
    },
    {
      title: "Build",
      text: "Created procedural setup and visual system."
    },
    {
      title: "Delivery",
      text: "Rendered final visuals and prepared reusable assets."
    }
  ]
}
```

Количество пунктов может быть не только 3, но текущий дизайн лучше всего выглядит с тремя.

---

## 26. Блок `quote`

Крупная цитата / statement.

```js
{
  type: "quote",
  text: "A project page should be flexible enough for a long case study, but simple enough for a one-evening upload."
}
```

Где использовать:

```txt
ключевая мысль
крупный слоган
вывод по проекту
```

---

## 27. Блок `credits`

Блок с ролями, задачами, outputs.

```js
{
  type: "credits",
  items: [
    {
      label: "Role",
      value: "3D direction, lookdev, render system"
    },
    {
      label: "Output",
      value: "Hero images, crops, presentation visuals"
    }
  ]
}
```

Можно добавить больше пунктов:

```js
{
  type: "credits",
  items: [
    { label: "Client", value: "NDA" },
    { label: "Role", value: "3D pipeline and rendering" },
    { label: "Tools", value: "Blender, Houdini, Python" },
    { label: "Output", value: "Realtime-ready assets and renders" }
  ]
}
```

---

# Часть 4. Полный пример нового проекта

---

## 28. Создать папку

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

## 29. Добавить объект в `projects.js`

```js
{
  slug: "robot-arm",
  title: "Robot Arm",
  type: "Pipeline",
  year: "2026",
  client: "Internal R&D",
  duration: "00:36",
  featured: false,
  ratio: "wide",
  accent: "from-stone-100 via-zinc-200 to-slate-300",
  shape: "scan",

  description: "Pipeline for preparing robotic arm assets for real-time and presentation use.",
  subtitle: "From technical input geometry to optimized visual production assets.",

  tools: ["Blender", "Houdini", "Python", "Unity"],

  cover: {
    type: "image",
    src: "/projects/robot-arm/cover.jpg",
    alt: "Robot Arm cover image",
  },

  hero: {
    type: "video",
    src: "/projects/robot-arm/hero.mp4",
    poster: "/projects/robot-arm/cover.jpg",
  },

  blocks: [
    {
      type: "text",
      label: "Project note",
      columns: [
        "The project started from a technical model that needed to become presentation-ready.",
        "The final system included cleaned geometry, material setup and optimized outputs."
      ],
    },
    {
      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/robot-arm/01.jpg",
          alt: "Robot Arm process image",
        },
        {
          type: "image",
          src: "/projects/robot-arm/02.jpg",
          alt: "Robot Arm final render",
        },
      ],
    },
    {
      type: "media",
      media: {
        type: "image",
        src: "/projects/robot-arm/03.jpg",
        alt: "Robot Arm detail render",
      },
      size: "large",
      caption: "Detail view of the optimized asset.",
    },
    {
      type: "process",
      items: [
        {
          title: "Input",
          text: "Technical model, references and target platform constraints."
        },
        {
          title: "Cleanup",
          text: "Geometry cleanup, hierarchy, naming and material preparation."
        },
        {
          title: "Output",
          text: "Presentation renders and optimized realtime-ready assets."
        }
      ]
    },
    {
      type: "credits",
      items: [
        { label: "Role", value: "Pipeline, optimization, lookdev" },
        { label: "Output", value: "Realtime asset, renders, documentation" }
      ]
    }
  ],
}
```

После этого проект будет доступен по адресу:

```txt
/work/robot-arm
```

---

# Часть 5. Как добавлять новые типы блоков

---

## 30. Где находится renderer блоков

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
1. Создать новую функцию блока в этом же файле
2. Добавить условие в ProjectBlocks
3. Использовать новый type в projects.js
```

---

## 31. Пример: добавить блок `twoColumnTextMedia`

В `ProjectBlocks.jsx` добавить функцию:

```jsx
function TwoColumnTextMediaBlock({ block, project }) {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-5 px-5 py-16 md:grid-cols-2 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
          {block.label}
        </p>
        <h2 className="mb-6 text-4xl font-black tracking-[-0.05em] md:text-6xl">
          {block.title}
        </h2>
        <p className="text-lg leading-relaxed text-zinc-700">
          {block.text}
        </p>
      </div>

      <ProjectMedia media={block.media} project={project} className="min-h-[520px]" />
    </section>
  );
}
```

Потом добавить в renderer:

```jsx
if (block.type === "twoColumnTextMedia") {
  return <TwoColumnTextMediaBlock key={index} block={block} project={project} />;
}
```

Теперь можно использовать в `projects.js`:

```js
{
  type: "twoColumnTextMedia",
  label: "Technical note",
  title: "Geometry cleanup",
  text: "The original input geometry was reorganized, renamed and optimized for downstream production.",
  media: {
    type: "image",
    src: "/projects/robot-arm/process-01.jpg",
    alt: "Geometry cleanup process"
  }
}
```

---

# Часть 6. Как менять внешний вид существующих блоков

---

## 32. Изменить отступы блоков

В блоках часто встречается:

```txt
px-5 py-16 md:px-8 md:py-24
```

Это значит:

```txt
px-5      горизонтальные отступы на мобильных
py-16     вертикальные отступы на мобильных
md:px-8   горизонтальные отступы с breakpoint md
md:py-24  вертикальные отступы с breakpoint md
```

Чтобы сделать блоки плотнее:

```txt
py-10 md:py-16
```

Чтобы сделать больше воздуха:

```txt
py-24 md:py-32
```

---

## 33. Изменить скругления

Сейчас часто используется:

```txt
rounded-[2rem]
```

Более мягко:

```txt
rounded-3xl
```

Более резко:

```txt
rounded-xl
```

Совсем без скругления:

```txt
rounded-none
```

---

## 34. Изменить типографику

Крупные заголовки используют:

```txt
font-black
uppercase
leading-[0.78]
tracking-[-0.08em]
```

Если нужен менее агрессивный стиль:

```txt
font-bold
normal-case
leading-none
tracking-[-0.04em]
```

---

## 35. Изменить карточки на главной

Файл:

```txt
src/components/projects/ProjectCard.jsx
```

Основной контейнер:

```jsx
<article className={`group relative overflow-hidden rounded-[2rem] ${ratio}`}>
```

Hover-плашка:

```jsx
<div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 opacity-0 transition duration-300 group-hover:opacity-100">
```

Если нужно, чтобы подпись была видна всегда, заменить:

```txt
opacity-0 group-hover:opacity-100
```

на:

```txt
opacity-100
```

---

# Часть 7. Проверка перед публикацией

---

## 36. Чеклист перед commit

```txt
[ ] npm run dev работает
[ ] / открывается
[ ] /work открывается
[ ] /work/new-project открывается
[ ] все картинки загружаются
[ ] видео autoplay работает
[ ] в консоли нет красных ошибок
[ ] slug совпадает с папкой проекта
[ ] пути к медиа начинаются с /projects/
[ ] project object закрыт запятой
[ ] массив projects не сломан
```

---

## 37. Команды

```bash
npm run dev
```

```bash
npm run build
```

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

# Часть 8. Частые ошибки

---

## 38. Белая / пустая страница

Смотри консоль браузера:

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
```

---

## 39. ProjectMedia is not defined

В файле:

```txt
src/components/projects/ProjectBlocks.jsx
```

должен быть импорт:

```js
import ProjectMedia from "../media/ProjectMedia";
```

---

## 40. projects is not defined

В файле, где используется `projects`, должен быть импорт:

```js
import { projects } from "../data/projects";
```

Путь зависит от расположения файла.

---

## 41. Картинка не отображается

Проверь путь.

Файл лежит здесь:

```txt
public/projects/robot-arm/cover.jpg
```

В коде путь должен быть:

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

## 42. Страница проекта перекидывает на `/work`

Значит проект не найден по slug.

Проверь URL:

```txt
/work/robot-arm
```

И поле в объекте:

```js
slug: "robot-arm"
```

Они должны совпадать.

---

## 43. Новый фильтр появился сам

Это нормально.

Фильтры строятся автоматически:

```js
export const filters = [
  "All",
  ...Array.from(new Set(projects.map((project) => project.type))),
];
```

Если добавил новый `type`, он появится на главной.

---

# Часть 9. Рекомендации по контенту

---

## 44. Какой порядок блоков обычно хорошо работает

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

## 45. Сколько текста писать

Для портфолио лучше:

```txt
короткий subtitle
1–2 текстовых блока
2–6 визуальных блоков
короткий process
чёткие credits
```

Не нужно превращать каждый кейс в длинную статью.

Хороший принцип:

```txt
visual first, explanation second
```

---

## 46. Как оформлять NDA-кейсы

Можно не раскрывать клиента и детали.

Используй нейтральные формулировки:

```js
client: "NDA Project"
```

```js
description: "A production pipeline for preparing complex 3D assets for interactive use."
```

```js
credits: [
  { label: "Role", value: "3D pipeline, optimization, lookdev" },
  { label: "Output", value: "Realtime-ready assets and internal presentation visuals" }
]
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

# Часть 10. Главный рабочий сценарий

Когда нужно добавить новый проект:

```txt
1. Придумать slug
2. Создать папку public/projects/slug/
3. Подготовить cover.jpg и hero.jpg/hero.mp4
4. Положить дополнительные изображения 01.jpg, 02.jpg, 03.jpg
5. Скопировать минимальный шаблон проекта
6. Вставить его в src/data/projects.js
7. Заполнить title, type, year, client, description, subtitle, tools
8. Настроить cover и hero
9. Собрать blocks
10. Проверить /work/slug
11. Проверить главную и /work
12. Сделать npm run build
13. Commit / push
```

Главное правило:

```txt
Если меняется конкретный кейс — редактируй projects.js и public/projects/slug/.
Если меняется внешний вид всех кейсов — редактируй компоненты.
Если появляется новый тип секции — добавляй новый block в ProjectBlocks.jsx.
```

