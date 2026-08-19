export const reusableProcess = [
  {
    title: {
      en: "Input",
      ru: "Вход",
    },
    text: {
      en: "Brief, references, constraints, geometry, datasets or source materials.",
      ru: "Бриф, референсы, наборы данных, геометрия или просто идея.",
    },
  },
  {
    title: {
      en: "System",
      ru: "Система",
    },
    text: {
      en: "Procedural setup, material logic, lighting, layout rules and production decisions.",
      ru: "Выбор инструментария, процедурный сетап, моделирование, создание материалов, свет, принятие решений.",
    },    
  },
  {
      title: {
      en: "Output",
      ru: "Выход",
    },
    text: {
      en: "Renders, animations, reusable assets, prototypes or presentation materials.",
      ru: "Рендеры, анимации, 3D ассеты, прототипы или материалы для презентаций",
    },
  },

];

export const projects = [
  {
    slug: "arthritis",
    caseStudy: true,

  title: {
    en: "Visualizing Arthritis Progression",
    ru: "Визуализация развития артрита",
  },

  typeKey: "Explain",

  type: { en: "Medical visualization", ru: "Медицинская визуализация" },

  year: "2024",

  client: { en: "Commercial / Confidential", ru: "Коммерческий проект / Конфиденциально" },

  featured: true,
  ratio: "square",
  accent: "from-orange-50 via-orange-200 to-amber-100",
  shape: "orb",

  description: {
    en: "A commercial medical visualization created to support the promotion of a new pharmaceutical product through an AR experience and web content.",
    ru: "Коммерческая медицинская визуализация для продвижения нового фармацевтического продукта через AR-приложение и контент для сайта.",
  },

  subtitle: {
    en: "Making a complex medical process easy to understand.",
    ru: "Сделать сложный медицинский процесс понятным.",
  },

  tools: [
    { en: "3D visualization", ru: "3D-визуализация" },
    { en: "Animation", ru: "Анимация" },
    { en: "AR-ready asset", ru: "Ассет для AR" },
    { en: "Web render", ru: "Рендер для сайта" },
  ],

  cover: {
    type: "video",
    src: "/projects/arthritis/hero.mp4",
    poster: "/projects/arthritis/cover.png",
    alt: {
      en: "Animation visualizing the progression of arthritis",
      ru: "Анимация, показывающая развитие артрита",
    },
  },

  hero: {
    type: "video",
    src: "/projects/arthritis/hero.mp4",
    poster: "/projects/arthritis/cover.png",
  },

  blocks: [
    {
      type: "caseSection",
      number: "01",
      label: { en: "The Challenge", ru: "Задача" },
      title: {
        en: "Make disease progression clear enough to support a product story.",
        ru: "Понятно показать развитие заболевания в контексте продвижения продукта.",
      },
      paragraphs: [
        {
          en: "The work formed part of the promotion of a new pharmaceutical product. The communication task was not simply to create an animation of arthritis, but to make the progression of the disease understandable within a commercial experience.",
          ru: "Работа была частью продвижения нового фармацевтического продукта. Коммуникационная задача заключалась не просто в создании анимации артрита, а в понятном показе развития заболевания в коммерческом контексте.",
        },
        {
          en: "The visualization needed to communicate a complex medical process clearly across both an AR application and web content, while keeping the client and product confidential.",
          ru: "Визуализация должна была ясно объяснять сложный медицинский процесс как в AR-приложении, так и в контенте для сайта, не раскрывая заказчика и продукт.",
        },
      ],
    },
    {
      type: "caseSection",
      number: "02",
      label: { en: "The Approach", ru: "Подход" },
      title: {
        en: "How can the progression of the disease be understood at a glance?",
        ru: "Как сделать развитие заболевания понятным с первого взгляда?",
      },
      paragraphs: [
        {
          en: "I structured the visualization as a controlled sequence rather than a single dramatic image. Each stage keeps the same point of view and visual logic, so the viewer can focus on what changes instead of re-reading the anatomy every time.",
          ru: "Я построил визуализацию как управляемую последовательность, а не как один эффектный кадр. На каждой стадии сохраняются ракурс и визуальная логика, поэтому зритель следит за изменениями, не разбирая анатомию заново.",
        },
        {
          en: "The progression moves from a clear baseline toward increasingly visible change. Consistent framing, materials and pacing turn the stages into one coherent explanation that can work in motion, AR and still imagery.",
          ru: "Последовательность начинается с понятного исходного состояния и постепенно показывает всё более заметные изменения. Единые ракурс, материалы и темп объединяют стадии в одно объяснение для анимации, AR и статичных изображений.",
        },
      ],
    },
    {
      type: "stageSystem",
      number: "03",
      label: { en: "Visual System", ru: "Визуальная система" },
      title: { en: "One visual language. Four readable stages.", ru: "Один визуальный язык. Четыре понятные стадии." },
      intro: {
        en: "The sequence is designed as a visual comparison system. The final media can be dropped into these containers without changing the narrative structure.",
        ru: "Последовательность построена как система визуального сравнения. Финальные материалы можно добавить в эти контейнеры, не меняя структуру истории.",
      },
items: [
  {
    title: { en: "Healthy", ru: "Здоровое состояние" },
    note: { en: "Baseline", ru: "Исходная точка" },
    media: {
      type: "image",
      src: "/projects/arthritis/stages/lumbar_00.webp",
      alt: {
        en: "Healthy joint",
        ru: "Здоровый сустав",
      },
    },
  },
  {
    title: { en: "Early stage", ru: "Ранняя стадия" },
    note: {
      en: "First visible change",
      ru: "Первые заметные изменения",
    },
    media: {
      type: "image",
      src: "/projects/arthritis/stages/lumbar_01.webp",
      alt: {
        en: "Early stage of arthritis",
        ru: "Ранняя стадия артрита",
      },
    },
  },
  {
    title: { en: "Progression", ru: "Развитие" },
    note: {
      en: "Change becomes clearer",
      ru: "Изменения становятся выраженными",
    },
    media: {
      type: "image",
      src: "/projects/arthritis/stages/lumbar_02.webp",
      alt: {
        en: "Progression of arthritis",
        ru: "Развитие артрита",
      },
    },
  },
  {
    title: { en: "Advanced stage", ru: "Поздняя стадия" },
    note: {
      en: "Most developed state",
      ru: "Наиболее выраженное состояние",
    },
    media: {
      type: "image",
      src: "/projects/arthritis/stages/lumbar_03.webp",
      alt: {
        en: "Advanced stage of arthritis",
        ru: "Поздняя стадия артрита",
      },
    },
  },
  {
    title: { en: "Advanced stage", ru: "Поздняя стадия" },
    note: {
      en: "Most developed state",
      ru: "Наиболее выраженное состояние",
    },
    media: {
      type: "image",
      src: "/projects/arthritis/stages/lumbar_04.webp",
      alt: {
        en: "Advanced stage of arthritis",
        ru: "Поздняя стадия артрита",
      },
    },
  },
],
    },
    {
      type: "formatSplit",
      number: "04",
      label: { en: "One Solution, Multiple Formats", ru: "Одно решение — несколько форматов" },
      title: { en: "Built once, adapted to the context.", ru: "Одна система, адаптированная под разные задачи." },
      items: [
        {
          title: { en: "AR Experience", ru: "AR-приложение" },
          text: {
            en: "An AR-ready 3D asset allowed the progression to be experienced spatially and viewed in context.",
            ru: "Подготовленный для AR 3D-ассет позволил рассматривать развитие заболевания в пространстве и в контексте.",
          },
          media: { type: "placeholder" },
        },
        {
          title: { en: "Web Communication", ru: "Коммуникация на сайте" },
          text: {
            en: "Rendered content translated the same visual system into clear, controlled imagery for the product’s web presence.",
            ru: "Рендеры перенесли ту же визуальную систему в ясные и контролируемые изображения для страницы продукта.",
          },
          media: {
            type: "model3d",
            src: "/projects/arthritis/model.glb",
            poster: "/projects/arthritis/cover.png",
            animationConfig: "/projects/arthritis/model-animation.json",
            alt: {
              en: "Interactive anatomical model",
              ru: "Интерактивная анатомическая модель",
            },
          },
        },
      ],
    },
    {
      type: "breakdownGrid",
      number: "05",
      label: { en: "Behind the Solution", ru: "Как устроено решение" },
      title: { en: "The production system behind the final explanation.", ru: "Производственная система за финальным объяснением." },
      intro: {
        en: "These slots are ready for process images, short clips or annotated breakdowns as the case materials are added.",
        ru: "Эти блоки подготовлены для изображений процесса, коротких видео и разборов по мере добавления материалов кейса.",
      },
      items: [
        { title: { en: "Model & anatomy", ru: "Модель и анатомия" }, media: { type: "placeholder" } },
        { title: { en: "Materials", ru: "Материалы" }, media: { type: "placeholder" } },
        { title: { en: "Disease stages", ru: "Стадии заболевания" }, media: { type: "placeholder" } },
        { title: { en: "Animation", ru: "Анимация" }, media: { type: "placeholder" } },
        { title: { en: "AR asset", ru: "AR-ассет" }, media: { type: "placeholder" } },
        { title: { en: "Render breakdown", ru: "Разбор рендера" }, media: { type: "placeholder" } },
      ],
    },
    {
      type: "outcome",
      number: "06",
      label: { en: "Outcome", ru: "Результат" },
      title: {
        en: "A reusable visual explanation for two commercial touchpoints.",
        ru: "Единое визуальное объяснение для двух коммерческих форматов.",
      },
      text: {
        en: "The project delivered a consistent way to communicate arthritis progression across an AR experience and web content. It gave the campaign a clear visual sequence for explaining the medical process while keeping the public case focused on the solution rather than confidential client details.",
        ru: "Проект дал единый способ показывать развитие артрита в AR-приложении и материалах для сайта. Кампания получила понятную визуальную последовательность для объяснения медицинского процесса, а публичный кейс сохранил фокус на решении без раскрытия конфиденциальных деталей.",
      },
      note: {
        en: "Public case scope: communication deliverables only.",
        ru: "Публичный кейс описывает только коммуникационные материалы.",
      },
    },
    {
      type: "finalCta",
      title: { en: "Have something complex to explain?", ru: "Нужно объяснить что-то сложное?" },
      text: {
        en: "I help turn technical, scientific and abstract ideas into visual experiences people can quickly understand.",
        ru: "Помогаю превращать технические, научные и абстрактные идеи в визуальный опыт, который можно быстро понять.",
      },
      primaryAction: { label: { en: "Let’s talk", ru: "Обсудить" }, href: "/:locale#contact" },
    },
  ],
  },
  {    slug: "earthquakes",

  title: {
    en: "Earthquakes dataset visualization",
    ru: "Визуализация данных по землетрясениям",
  },

  typeKey: "Dataset",

  type: {
    en: "Dataset Visuals",
    ru: "Визуализация данных",
  },

  year: "2025",

  client: {
    en: "Personal Project",
    ru: "Личный проект",
  },

  featured: true,
  ratio: "square",
  accent: "from-orange-100 via-orange-300 to-amber-200",
  shape: "plant",

  description: {
    en: "A data-driven animation showing earthquake events across the globe.",
    ru: "Анимация на основе данных, показывающая землетрясения по всему миру.",
  },

  subtitle: {
    en: "Turning earthquake records into a readable spatial sequence of events.",
    ru: "Превращаю записи о землетрясениях в понятную пространственную последовательность событий.",
  },

  tools: [
    "Houdini",
    "Karma",
  ],

  cover: {
    type: "video",
    src: "/projects/earthquakes/hero.mp4",
    //type: "image",
    //src: "/projects/earthquakes/cover.png",
    alt: {
      en: "Earthquake data visualization",
      ru: "Визуализация данных о землетрясениях",
    },
  },

  hero: {
    type: "video",
    src: "/projects/earthquakes/hero.mp4",
    poster: "/projects/earthquakes/cover.png",
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
          en: "The project explores how earthquake records can be translated into a readable spatial animation.",
          ru: "Проект исследует, как превратить записи о землетрясениях в понятную пространственную анимацию.",
        },
        {
          en: "A consistent visual system connects each event to its place and sequence in the dataset.",
          ru: "Единая визуальная система связывает каждое событие с его местом и последовательностью в наборе данных.",
        },
      ],
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
            en: "Earthquake records and the geographic context of each event.",
            ru: "Записи о землетрясениях и географический контекст каждого события.",
          },
        },
        {
          title: {
            en: "System",
            ru: "Система",
          },
          text: {
            en: "A procedural system for placing and sequencing the data in 3D.",
            ru: "Процедурная система для размещения и последовательного показа данных в 3D.",
          },
        },
        {
          title: {
            en: "Output",
            ru: "Результат",
          },
          text: {
            en: "An animated visualization of earthquake events across the globe.",
            ru: "Анимированная визуализация землетрясений по всему миру.",
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
            en: "Data visualization, procedural system, look development",
            ru: "Визуализация данных, процедурная система, разработка визуального стиля",
          },
        },
        {
          label: {
            en: "Outputs",
            ru: "Результаты",
          },
          value: {
            en: "3D animation",
            ru: "3D-анимация",
          },
        },
      ],
    },
  ],
  },
];

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
      projects
        .filter((project) => project.typeKey)
        .map((project) => [
          project.typeKey,
          {
            key: project.typeKey,
            label: project.type,
          },
        ])
    ).values()
  ),
];
export function getProject(slug) {
  return projects.find((project) => project.slug === slug);
}
export function getNextProject(slug) {
  const currentIndex = projects.findIndex((project) => project.slug === slug);
  return projects[(currentIndex + 1) % projects.length];
}
