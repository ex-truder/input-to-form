export const homeContent = {
  hero: {
    eyebrow: {
      en: "Visual solutions for complex products",
      ru: "Визуальные решения для сложных продуктов",
    },
    title: {
      en: "Make the complex clear",
      ru: "Сложное становится понятным",
    },
    text: {
      en: "I help companies explain products, prepare launches, make data readable and build visual content for digital platforms.",
      ru: "Помогаю компаниям объяснять продукты, готовить запуски, делать данные понятными и создавать визуальный контент для цифровых платформ.",
    },
    primaryAction: { en: "Discuss a task", ru: "Обсудить задачу" },
    secondaryAction: { en: "View solutions", ru: "Посмотреть решения" },
    formats: [
      { en: "3D and animation", ru: "3D и анимация" },
      { en: "Data visualization", ru: "Визуализация данных" },
      { en: "AR, VR and web", ru: "AR, VR и web" },
      { en: "Repeatable content systems", ru: "Системы производства контента" },
    ],
  },

  solutionsIntro: {
    eyebrow: { en: "Business tasks", ru: "Бизнес-задачи" },
    title: {
      en: "First define the goal. Then choose the right format.",
      ru: "Сначала определяем задачу — затем выбираем формат.",
    },
  },

  solutions: [
    {
      id: "explain-product",
      theme: "paper",
      number: "01",
      label: { en: "Communication", ru: "Коммуникация" },
      title: {
        en: "Explain a complex product or process",
        ru: "Объяснить сложный продукт или процесс",
      },
      summary: {
        en: "Show how a product works when its value is hidden inside and cannot be captured with a regular photograph.",
        ru: "Показать принцип работы продукта, когда его ценность скрыта внутри и не передаётся обычной фотографией.",
      },
      contexts: {
        en: ["Sales", "Presentations", "Training"],
        ru: ["Продажи", "Презентации", "Обучение"],
      },
      projectSlug: "arthritis",
      caseTitle: {
        en: "Visualizing the development of arthritis",
        ru: "Визуализация развития артрита",
      },
      caseDescription: {
        en: "An animated anatomical model makes disease stages and internal changes visible without relying on live-action footage.",
        ru: "Анимированная анатомическая модель делает стадии заболевания и внутренние изменения наглядными без натурной съёмки.",
      },
      media: {
        type: "video",
        src: "/projects/arthritis/hero.mp4",
        poster: "/projects/arthritis/cover.png",
      },
    },
    {
      id: "show-before-production",
      theme: "surface",
      number: "02",
      label: { en: "Launch", ru: "Запуск" },
      title: {
        en: "Show the result before it exists",
        ru: "Показать результат до его появления",
      },
      summary: {
        en: "Create convincing material for approval, presentation or launch when only references, descriptions or geometry are available.",
        ru: "Подготовить убедительные материалы для согласования, презентации или запуска, когда есть только референсы, описание или геометрия.",
      },
      contexts: {
        en: ["Pre-sales", "Approval", "Product launch"],
        ru: ["Предпродажи", "Согласование", "Запуск продукта"],
      },
      projectSlug: "arthritis",
      caseTitle: {
        en: "From medical references to an AR-ready prototype",
        ru: "От медицинских материалов к AR-прототипу",
      },
      caseDescription: {
        en: "The future experience was validated as a visual model before it was delivered to the target platform.",
        ru: "Будущий пользовательский опыт был проверен на визуальной модели до передачи результата на целевую платформу.",
      },
      media: {
        type: "image",
        src: "/projects/arthritis/cover.png",
        alt: {
          en: "Anatomical model created for the arthritis project",
          ru: "Анатомическая модель для проекта об артрите",
        },
      },
    },
    {
      id: "make-data-readable",
      theme: "dark",
      number: "03",
      label: { en: "Data", ru: "Данные" },
      title: {
        en: "Turn data into a clear story",
        ru: "Превратить данные в понятную историю",
      },
      summary: {
        en: "Reveal time, scale and relationships that are difficult to see in tables or static charts.",
        ru: "Показать время, масштаб и взаимосвязи, которые трудно увидеть в таблицах и статичных графиках.",
      },
      contexts: {
        en: ["Analytics", "Research", "Public communication"],
        ru: ["Аналитика", "Исследования", "Публичная коммуникация"],
      },
      projectSlug: "earthquakes",
      caseTitle: {
        en: "Earthquake records as a spatial sequence",
        ru: "Данные о землетрясениях как пространственная последовательность",
      },
      caseDescription: {
        en: "A dataset was translated into an animated view of where events happened, how strong they were and how they unfolded over time.",
        ru: "Массив данных преобразован в анимацию, показывающую положение, силу и последовательность событий во времени.",
      },
      media: {
        type: "video",
        src: "/projects/earthquakes/hero.mp4",
        poster: "/projects/earthquakes/cover.png",
      },
    },
    {
      id: "digital-product",
      theme: "accentSoft",
      number: "04",
      label: { en: "Digital product", ru: "Цифровой продукт" },
      title: {
        en: "Build content for a digital platform",
        ru: "Создать контент для цифровой платформы",
      },
      summary: {
        en: "Prepare visuals that retain their meaning and quality inside AR, VR, web or another real-time environment.",
        ru: "Подготовить визуал, который сохраняет смысл и качество внутри AR, VR, web или другой real-time среды.",
      },
      contexts: {
        en: ["AR and VR", "Web", "Interactive presentations"],
        ru: ["AR и VR", "Web", "Интерактивные презентации"],
      },
      projectSlug: "arthritis",
      caseTitle: {
        en: "Disease-stage animation prepared for AR",
        ru: "Анимация стадий заболевания для AR",
      },
      caseDescription: {
        en: "One topology and a controlled transition between stages made the anatomical model suitable for a real-time experience.",
        ru: "Единая топология и управляемый переход между стадиями позволили использовать анатомическую модель в real-time.",
      },
      media: {
        type: "image",
        src: "/projects/arthritis/cover.png",
        alt: {
          en: "Real-time anatomical asset",
          ru: "Анатомический ассет для real-time",
        },
      },
    },
    {
      id: "scale-production",
      theme: "paper",
      number: "05",
      label: { en: "Scale", ru: "Масштабирование" },
      title: {
        en: "Make content production repeatable",
        ru: "Сделать производство контента повторяемым",
      },
      summary: {
        en: "Turn recurring visual decisions into rules, templates or a procedural system instead of rebuilding every output manually.",
        ru: "Превратить повторяющиеся визуальные решения в правила, шаблоны или процедурную систему вместо ручной сборки каждого результата.",
      },
      contexts: {
        en: ["Product ranges", "Catalogues", "Recurring content"],
        ru: ["Продуктовые линейки", "Каталоги", "Регулярный контент"],
      },
      projectSlug: "earthquakes",
      caseTitle: {
        en: "A rule-based visualization from a changing dataset",
        ru: "Визуализация изменяемого массива данных по заданным правилам",
      },
      caseDescription: {
        en: "Mapping rules connect incoming records to position, scale, color and timing so the output can be reproduced with new data.",
        ru: "Правила связывают входные записи с положением, масштабом, цветом и временем, поэтому результат можно воспроизводить на новых данных.",
      },
      media: {
        type: "image",
        src: "/projects/earthquakes/cover.png",
        alt: {
          en: "Rule-based earthquake data visualization",
          ru: "Визуализация данных о землетрясениях по заданным правилам",
        },
      },
      note: {
        en: "The measurable effect of automation is assessed after discovery and a pilot.",
        ru: "Измеримый эффект автоматизации оценивается после исследования задачи и пилота.",
      },
    },
  ],

  process: {
    eyebrow: { en: "How work starts", ru: "Как начинается работа" },
    title: {
      en: "A clear path from the task to a usable result",
      ru: "Понятный путь от задачи до применимого результата",
    },
    items: [
      {
        title: { en: "Task and audience", ru: "Задача и аудитория" },
        text: {
          en: "We define what needs to be understood, by whom and in what context.",
          ru: "Определяем, что именно нужно объяснить, кому и в каком контексте.",
        },
      },
      {
        title: { en: "Prototype the approach", ru: "Прототип решения" },
        text: {
          en: "A key frame or prototype tests the most important visual and technical decisions.",
          ru: "Ключевой кадр или прототип проверяет основные визуальные и технические решения.",
        },
      },
      {
        title: { en: "Produce and deliver", ru: "Производство и передача" },
        text: {
          en: "The result is produced, checked for its target environment and delivered in the agreed formats.",
          ru: "Результат создаётся, проверяется в целевой среде и передаётся в согласованных форматах.",
        },
      },
    ],
  },

  cta: {
    eyebrow: { en: "Contact", ru: "Контакты" },
    title: {
      en: "Have a product or process that is difficult to show?",
      ru: "Есть продукт или процесс, который трудно показать?",
    },
    text: {
      en: "Tell me what needs to be explained, to whom and where the result will be used. A finished brief is not required for the first conversation.",
      ru: "Расскажите, что нужно объяснить, кому и где будет использоваться результат. Для первого разговора готовое техническое задание не требуется.",
    },
    action: { en: "Tell me about the task", ru: "Рассказать о задаче" },
  },
};
