const asset = "/projects/arthritis";

export const arthritisAnatomy = {
  type: "arthritisAnatomy",
  number: "04",
  label: { ru: "Анатомия", en: "Anatomy" },
  title: { ru: "Не только грудной отдел.", en: "Beyond the thoracic spine." },
  intro: {
    ru: "Изменения при артрите не ограничиваются грудным отделом позвоночника. В проекте показаны также шейный и поясничный отделы, тазобедренный и коленный суставы. Выберите область, чтобы сравнить исходное состояние и изменения на модели.",
    en: "Arthritic changes are not limited to the thoracic spine. The project also depicts the cervical and lumbar spine, hip and knee joints. Select a region to compare the baseline and changed states of the model.",
  },
  items: [
    { id: "thorasic", title: { ru: "Грудной отдел", en: "Thoracic spine" } },
    { id: "cervical", title: { ru: "Шейный отдел", en: "Cervical spine" } },
    { id: "lumbar", title: { ru: "Поясничный отдел", en: "Lumbar spine" } },
    { id: "pelvic", title: { ru: "Тазобедренный сустав", en: "Hip joint" } },
    { id: "knee", title: { ru: "Коленный сустав", en: "Knee joint" } },
  ].map((item) => ({ ...item,
    healthy: `${asset}/units/${item.id}_healthy.webp`,
    damaged: `${asset}/units/${item.id}_damaged.webp`,
  })),
};

export const arthritisOsteophytes = {
  type: "arthritisOsteophytes",
  number: "05",
  label: { ru: "Процесс", en: "Process" },
  title: { ru: "От скульптинга к карте нормалей.", en: "From sculpt to normal map." },
  intro: {
    ru: "Остеофиты создавал скульптингом: прорабатывал костные разрастания на детальной модели, затем переносил рельеф на облегчённую геометрию запечкой нормалей.",
    en: "I sculpted the osteophytes on a detailed model, then baked the surface relief into a normal map for the lower-resolution geometry.",
  },
  items: [
    {
      title: { ru: "Скульптинг", en: "Sculpting" },
      text: { ru: "От исходной формы позвонков к модели с костными разрастаниями. На этом этапе задаётся форма остеофитов и рельеф поверхности.", en: "From the initial vertebrae to the sculpt with bony growths. This stage defines the osteophytes and surface relief." },
      images: [
        { file: "sculpt_ostheo0", label: { ru: "Исходная форма", en: "Initial form" } },
        { file: "sculpt_ostheo1", label: { ru: "Детальный скульпт", en: "Detailed sculpt" } },
      ],
    },
    {
      title: { ru: "Облегчённая сетка", en: "Lower-resolution mesh" },
      text: { ru: "Геометрия сохраняет основные объёмы и силуэт. Каркас показывает сетку, на которую переносится детализация скульпта.", en: "The geometry retains the main volumes and silhouette. The wireframe shows the mesh that receives the sculpted detail." },
      images: [{ file: "low_ostheo1_wireframe", label: { ru: "Каркас модели", en: "Model wireframe" } }],
    },
    {
      title: { ru: "Запечка нормалей", en: "Normal baking" },
      text: { ru: "Карта нормалей передаёт мелкий рельеф детальной модели через освещение поверхности. Справа — облегчённая модель с перенесённой детализацией.", en: "The normal map carries fine surface relief through the lighting response. On the right is the lower-resolution model with the transferred detail." },
      images: [
        { file: "normals", label: { ru: "Карта нормалей", en: "Normal map" } },
        { file: "low_ostheo1", label: { ru: "Результат запечки", en: "Baked result" } },
      ],
    },
  ].map((item) => ({ ...item, images: item.images.map((image) => ({ ...image, src: `${asset}/tech/${image.file}.webp` })) })),
};
