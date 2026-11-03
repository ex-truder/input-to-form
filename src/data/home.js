export const homeContent = {
  hero: {
    eyebrow: { en: "From input to form", ru: "От исходных данных к форме" },
    title: { en: "Make complex things clear", ru: "Сделать сложное понятным" },
    text: {
      en: "I create visual systems for things that need to be built, explained or made faster.",
      ru: "Создаю визуальные системы для задач, которые нужно построить, объяснить или ускорить.",
    },
    primaryAction: { en: "Discuss a project", ru: "Обсудить задачу" },
    secondaryAction: { en: "See what I do", ru: "Смотреть направления" },
    background: {
      type: "three",
      scene: "cursor-cubes",
      overlay: "light",
      opacity: 0.9,
      scrollDriven: false,
      interactive: true,
      intensity: 1,
      sceneProps: {
        baseColor: 0xa79f98,
        flashColor: 0xff4d00,
        cubeSize: 0.2,
        spacing: 0.5,
        opacity: 0.15,
      },
    },
  },
  directions: {
    items: [
      {
        id: "build",
        number: "01",
        title: { en: "Build", ru: "Создаю" },
        statement: { en: "Create something that does not exist yet.", ru: "Создать то, чего ещё не существует." },
        text: {
          en: "I turn data, rules and technical constraints into a working visual system.",
          ru: "Превращаю данные, правила и технические ограничения в работающую визуальную систему.",
        },
        case: {
          slug: "building-gen",
          label: { en: "Build case", ru: "Кейс «Создаю»" },
          title: { en: "Residential building generator", ru: "Генератор жилых домов" },
          summary: {
            en: "Client-provided or generated source data becomes buildings for presentations and assembly or destruction simulations.",
            ru: "На основе данных заказчика или собственной генерации создаём здания для презентаций и симуляций сборки или разрушения.",
          },
          logic: {
            en: "One input → many outputs",
            ru: "Один вход → множество выходов",
          },
          action: { en: "View case", ru: "Смотреть кейс" },
        },
      },
      {
        id: "explain",
        number: "02",
        title: { en: "Explain", ru: "Объясняю" },
        statement: { en: "Make a complex idea understandable at a glance.", ru: "Объяснить сложную идею с первого взгляда." },
        text: {
          en: "I translate technical, scientific and abstract processes into a clear visual sequence.",
          ru: "Перевожу технические, научные и абстрактные процессы в понятную визуальную последовательность.",
        },
        case: {
          slug: "arthritis",
          label: { en: "Explain case", ru: "Кейс «Объясняю»" },
          title: { en: "Visualizing arthritis progression", ru: "Визуализация развития артрита" },
          summary: {
            en: "A commercial medical visualization that makes disease progression readable across AR and web content.",
            ru: "Коммерческая медицинская визуализация, которая понятно показывает развитие заболевания в AR и материалах для сайта.",
          },
          logic: {
            en: "Medical process → four stages → one visual sequence",
            ru: "Медицинский процесс → четыре стадии → одна визуальная последовательность",
          },
          action: { en: "View case", ru: "Смотреть кейс" },
        },
      },
      {
        id: "save-time",
        number: "03",
        title: { en: "Save Time", ru: "Ускоряю" },
        statement: { en: "Turn repeated manual work into a reusable tool.", ru: "Превратить повторяющуюся ручную работу в переиспользуемый инструмент." },
        text: {
          en: "I identify repeatable decisions and build assets or systems that reduce production setup.",
          ru: "Нахожу повторяемые решения и собираю ассеты или системы, которые сокращают подготовку производства.",
        },
        case: {
          label: { en: "Save Time case", ru: "Кейс «Ускоряю»" },
          title: { en: "Device disassembly animation asset", ru: "Ассет для анимации разборки устройств" },
          summary: {
            en: "A reusable asset for creating disassembly animations of complex devices without setting up every part by hand.",
            ru: "Переиспользуемый ассет для создания анимаций разборки сложных устройств без ручной настройки каждой детали.",
          },
          logic: {
            en: "Complex assembly → reusable controls → repeatable animation",
            ru: "Сложная сборка → переиспользуемое управление → повторяемая анимация",
          },
          status: { en: "Case materials coming soon", ru: "Материалы кейса скоро появятся" },
          media: { type: "placeholder", accent: "from-orange-100 via-orange-300 to-amber-200", shape: "orb" },
        },
      },
    ],
  },
  process: {
    eyebrow: { en: "How I work", ru: "Как я работаю" },
    title: { en: "From the problem to a working visual.", ru: "От задачи к работающему визуалу." },
    items: [
      {
        title: { en: "Understand", ru: "Понять" },
        text: { en: "Define the real task, audience and constraints.", ru: "Определить реальную задачу, аудиторию и ограничения." },
      },
      {
        title: { en: "Build", ru: "Собрать" },
        text: { en: "Create and test the visual system.", ru: "Создать и проверить визуальную систему." },
      },
      {
        title: { en: "Deliver", ru: "Передать" },
        text: { en: "Prepare the result for its target format.", ru: "Подготовить результат под целевой формат." },
      },
    ],
  },
  cta: {
    title: { en: "Have something complex to explain?", ru: "Есть что-то сложное?" },
    text: {
      en: "Send me the task or source materials. I will propose a clear way to turn them into a visual result.",
      ru: "Пришлите задачу или исходные материалы. Я предложу понятный способ превратить их в визуальный результат.",
    },
    action: { en: "Let’s talk", ru: "Обсудить" },
  },
};
