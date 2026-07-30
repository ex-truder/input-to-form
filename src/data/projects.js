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
  {    slug: "arthritis",

  title: {
    en: "Аrthritis visuals",
    ru: "Визуализация артрита",
  },

  typeKey: "Biology",

  type: {
    en: "Biology",
    ru: "Биология",
  },

  year: "2024",

  client: {
    en: "NDA",
    ru: "NDA",
  },

  featured: true,
  ratio: "square",
  accent: "from-green-100 via-lime-200 to-yellow-100",
  shape: "plant",

  description: {
    en: "Creation of an animated 3D model for an advertising campaign for a new drug to treat arthritis",
    ru: "Создание анимированной 3D модели для рекламной кампании нового препарата для лечения артрита.",
  },

  subtitle: {
    en: "",
    ru: "Данное заболевание неприятно по своей сути и по внешнему виду поражённых костей. Было решено использовать это качество для достижения негативного эффекта на зрителя (но не перестараться)."
  },

  tools: [
    "Blender3D",
    "Cycles",
  ],

  cover: {
    type: "video",
    src: "/projects/arthritis/hero.mp4",
    //type: "image",
    //src: "/projects/arthritis/cover.png",
    alt: {
      en: "Ostheoarthritis cover image",
      ru: "Обложка проекта Артрит",
    },
  },

  hero: {
    type: "video",
    src: "/projects/arthritis/hero.mp4",
    poster: "/projects/arthritis/cover.png",
  },

  blocks: [
    {      type: "text",

      label: {
        en: "Project note",
        ru: "О проекте",
      },

      columns: [
        {
          en: "This project started as a procedural study of botanical forms.",
          ru: "Чтобы врачу было удобнее ознакамливать пациента с неприглядными последствиями отказа от лечения, было разработано мобильное приложение с возможностью показа анимации в дополненной реальности.",
        },
        {
          en: "The goal was to create a flexible visual system rather than one isolated render.",
          ru: "Главная задача заключалась в умеренно реалистичном показе стадий развития патологии. Интересным вызовом стал именно перенос в AR, т.к. в данном случае необходимо было преодолеть ряд ограничений.",
        },
      ],
    },

    {      type: "model3d",
        src: "/projects/arthritis/model.glb",
        poster: "/projects/arthritis/poster.png",
        alt: {
          en: "Lumbar",
          ru: "Шейный отдел",
        },
        caption: {
          en: "",
          ru: "",
        },
    },

    {      type: "text",

      label: {
        en: "",
        ru: "Технологии",
      },

      columns: [
        {
          en: "",
          ru: "Заболевание начинается с истончения межпозвонковых дисков, затем может появиться грыжа, а на более поздних стадиях - костные отростки - остеофиты.",
        },
        {
          en: ".",
          ru: "Для достижения плавного перехода между стадиями, я создал несколько моделей и анимировал переход между ними через блендшейпы. Также создал два набора PBR текстур",
        },
      ],
    },

    {      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/synthetic-plant/01.jpg",
          alt: {
            en: "Synthetic plant detail render",
            ru: "Детальный рендер синтетического растения",
          },
        },
        {
          type: "image",
          src: "/projects/synthetic-plant/02.jpg",
          alt: {
            en: "Synthetic plant material study",
            ru: "Материальное исследование синтетического растения",
          },
        },
      ],
    },

    {      type: "process",
      items: [
        {
          title: {
            en: "Input",
            ru: "Входные данные",
          },
          text: {
            en: "References, botanical structure and visual constraints.",
            ru: "Референсы, ботаническая структура и визуальные ограничения.",
          },
        },
        {
          title: {
            en: "System",
            ru: "Система",
          },
          text: {
            en: "Procedural growth setup, material rules and lighting.",
            ru: "Процедурная система роста, правила материалов и свет.",
          },
        },
        {
          title: {
            en: "Output",
            ru: "Результат",
          },
          text: {
            en: "Hero renders, detail crops and reusable visual assets.",
            ru: "Hero-рендеры, детальные кропы и переиспользуемые визуальные ассеты.",
          },
        },
      ],
    },

    {      type: "credits",
      items: [
        {
          label: {
            en: "Role",
            ru: "Роль",
          },
          value: {
            en: "Generative forms, lookdev, art direction",
            ru: "Генеративные формы, lookdev, арт-дирекшн",
          },
        },
        {
          label: {
            en: "Outputs",
            ru: "Результаты",
          },
          value: {
            en: "Hero renders, crops, motion-ready assets",
            ru: "Hero-рендеры, кропы, ассеты для motion-задач",
          },
        },
      ],
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
  accent: "from-green-100 via-lime-200 to-yellow-100",
  shape: "plant",

  description: {
    en: "Animated 3D model for novel drug advertisement",
    ru: "Создание анимированной 3D модели для рекламной кампании нового препарата для лечения артрита.",
  },

  subtitle: {
    en: "A generative botanical study built as if it were a small product collection.",
    ru: "Артрит — это не только боль в суставах. Для многих пациентов это хроническое состояние, которое постепенно ограничивает физическую активность, снижает самостоятельность и влияет практически на все сферы жизни.",
  },

  tools: [
    "Houdini",
    "Karma",
  ],

  cover: {
    type: "video",
    src: "/projects/earthquakes/hero.mp4",
    //type: "image",
    //src: "/projects/earthquakes/cover.jpg",
    alt: {
      en: "Synthetic Plant cover image",
      ru: "Обложка проекта Синтетическое растение",
    },
  },

  hero: {
    type: "video",
    src: "/projects/earthquakes/hero.mp4",
    poster: "/projects/earthquakes/cover.jpg",
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
          en: "This project started as a procedural study of botanical forms.",
          ru: "Проект начался как процедурное исследование ботанических форм.",
        },
        {
          en: "The goal was to create a flexible visual system rather than one isolated render.",
          ru: "Целью было создать гибкую визуальную систему, а не один изолированный рендер.",
        },
      ],
    },
{
        type: "model3d",
        src: "/projects/ostheoarthritis/model.glb",
        poster: "/projects/ostheoarthritis/poster.png",
        alt: {
          en: "Test 3D model",
          ru: "Тестовая 3D-модель",
        },
        caption: {
          en: "Interactive model test.",
          ru: "Тест интерактивной модели.",
        },
      },
    {
      type: "mediaGrid",
      items: [
        {
          type: "image",
          src: "/projects/synthetic-plant/01.jpg",
          alt: {
            en: "Synthetic plant detail render",
            ru: "Детальный рендер синтетического растения",
          },
        },
        {
          type: "image",
          src: "/projects/synthetic-plant/02.jpg",
          alt: {
            en: "Synthetic plant material study",
            ru: "Материальное исследование синтетического растения",
          },
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
            en: "References, botanical structure and visual constraints.",
            ru: "Референсы, ботаническая структура и визуальные ограничения.",
          },
        },
        {
          title: {
            en: "System",
            ru: "Система",
          },
          text: {
            en: "Procedural growth setup, material rules and lighting.",
            ru: "Процедурная система роста, правила материалов и свет.",
          },
        },
        {
          title: {
            en: "Output",
            ru: "Результат",
          },
          text: {
            en: "Hero renders, detail crops and reusable visual assets.",
            ru: "Hero-рендеры, детальные кропы и переиспользуемые визуальные ассеты.",
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
            en: "Generative forms, lookdev, art direction",
            ru: "Генеративные формы, lookdev, арт-дирекшн",
          },
        },
        {
          label: {
            en: "Outputs",
            ru: "Результаты",
          },
          value: {
            en: "Hero renders, crops, motion-ready assets",
            ru: "Hero-рендеры, кропы, ассеты для motion-задач",
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