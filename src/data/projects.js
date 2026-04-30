export const reusableProcess = [
  {
    title: "Input",
    text: "Brief, references, constraints, geometry, datasets or source materials.",
  },
  {
    title: "System",
    text: "Procedural setup, material logic, lighting, layout rules and production decisions.",
  },
  {
    title: "Output",
    text: "Renders, animations, reusable assets, prototypes or presentation materials.",
  },
];

export const projects = [
  {
    slug: "glass-system",
    title: "Glass System",
    type: "CG / Product",
    year: "2026",
    client: "Personal Study",
    duration: "00:04",
    featured: true,
    ratio: "portrait",
    accent: "from-slate-200 via-zinc-300 to-stone-400",
    shape: "orb",
    description:
      "Transparent product system, refractive forms and clean catalog-ready visuals.",
    subtitle: "A compact study of glass, refraction and calm product presence.",
    tools: ["Houdini", "Redshift", "Lookdev", "Product CG"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Project note",
        columns: [
          "This case works as a clean template for product-oriented 3D projects: one strong hero visual, a compact explanation and a few atmospheric supporting frames.",
          "Replace the placeholders with real renders, crops, motion tests or technical images. The layout will stay consistent across the portfolio.",
        ],
      },
      {
        type: "mediaGrid",
        items: [
          { type: "placeholder", shape: "totem" },
          { type: "placeholder", shape: "ribbon" },
        ],
      },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "procedural-pencil",
    title: "Procedural Pencil",
    type: "3D Still",
    year: "2026",
    client: "Personal Study",
    duration: "00:06",
    featured: false,
    ratio: "square",
    accent: "from-orange-200 via-amber-300 to-zinc-400",
    shape: "pencil",
    description: "A playful object system built from simple primitives and material variation.",
    subtitle: "A small object turned into a visual identity exercise.",
    tools: ["Cinema 4D", "Redshift", "Procedural Modeling"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "System",
        columns: [
          "The object is intentionally simple, but the visual system can scale: material variants, camera angles, crops, close-ups and repeatable compositions.",
          "Use this structure for smaller studies that still deserve their own page without writing a long case-study article.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "stack" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "clear-motion",
    title: "Clear Motion",
    type: "Animation",
    year: "2025",
    client: "Internal R&D",
    duration: "00:08",
    featured: true,
    ratio: "wide",
    accent: "from-cyan-100 via-blue-200 to-violet-200",
    shape: "ribbon",
    description: "Soft transparent motion tests for loops, transitions and brand intros.",
    subtitle: "A set of fluid transitions designed as motion-system building blocks.",
    tools: ["Houdini", "Simulation", "Motion Design"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Motion logic",
        columns: [
          "This page can hold video loops, animated previews or still frames from motion tests. The same block renderer supports both image and video media.",
          "For final content, place files in public/projects/clear-motion/ and replace the placeholder media objects with video or image paths.",
        ],
      },
      {
        type: "mediaGrid",
        items: [
          { type: "placeholder", shape: "blob" },
          { type: "placeholder", shape: "console" },
        ],
      },
      {
        type: "quote",
        text: "A project page should be flexible enough for a long case study, but simple enough for a one-evening upload.",
      },
    ],
  },
  {
    slug: "material-study",
    title: "Material Study",
    type: "Shader R&D",
    year: "2025",
    client: "Internal R&D",
    duration: "00:10",
    featured: false,
    ratio: "portrait",
    accent: "from-lime-100 via-emerald-200 to-teal-300",
    shape: "totem",
    description: "A small library of tactile materials: translucent, glossy, matte and wet.",
    subtitle: "A material exploration that became a reusable lookdev kit.",
    tools: ["Octane", "Shader R&D", "Lighting"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Lookdev",
        columns: [
          "This template is useful for shader R&D: large surfaces, detail crops, comparison grids and short technical notes.",
          "You can keep the text short and let the material images do most of the work.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "cloth" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "retail-object",
    title: "Retail Object",
    type: "Brand Visual",
    year: "2025",
    client: "Commercial Concept",
    duration: "00:13",
    featured: true,
    ratio: "square",
    accent: "from-fuchsia-100 via-purple-200 to-indigo-200",
    shape: "box",
    description: "Hero visuals for a digital retail object with simple, premium staging.",
    subtitle: "A brand-object study for clean e-commerce and campaign visuals.",
    tools: ["Blender", "Product Render", "Art Direction"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Context",
        columns: [
          "This case format can work for client-safe presentations: title, role, scope, outputs and a few strong images without revealing sensitive production details.",
          "The public story can focus on process and visual direction while private details stay out of the portfolio.",
        ],
      },
      {
        type: "mediaGrid",
        items: [
          { type: "placeholder", shape: "box" },
          { type: "placeholder", shape: "grid" },
        ],
      },
      {
        type: "credits",
        items: [
          { label: "Role", value: "3D direction, lookdev, render system" },
          { label: "Output", value: "Hero images, crops, presentation visuals" },
        ],
      },
    ],
  },
  {
    slug: "soft-machine",
    title: "Soft Machine",
    type: "Simulation",
    year: "2024",
    client: "Personal Study",
    duration: "00:16",
    featured: false,
    ratio: "wide",
    accent: "from-rose-100 via-red-200 to-orange-200",
    shape: "blob",
    description: "Elastic shapes, slow collisions and abstract mechanical softness.",
    subtitle: "A procedural motion test about tension, softness and controlled accidents.",
    tools: ["Houdini", "Vellum", "Simulation"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Simulation",
        columns: [
          "Simulation projects often need less copy and more visual evidence: previews, viewport captures, final frames and parameter notes.",
          "The block structure lets you mix all of that without creating a new page layout every time.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "ribbon" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "input-array",
    title: "Input Array",
    type: "System Design",
    year: "2024",
    client: "Internal Framework",
    duration: "00:18",
    featured: true,
    ratio: "portrait",
    accent: "from-neutral-100 via-neutral-300 to-neutral-500",
    shape: "grid",
    description: "A visual framework for turning brief, data and geometry into reusable outputs.",
    subtitle: "From sketches and spreadsheets to structured visual systems.",
    tools: ["Houdini", "Python", "Data Viz", "Pipeline"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Framework",
        columns: [
          "A project can be described as an input-output system: what comes in, what happens inside, and what useful outputs are produced.",
          "This is especially helpful when the final work is NDA-constrained but the method is valuable to show.",
        ],
      },
      {
        type: "mediaGrid",
        items: [
          { type: "placeholder", shape: "grid" },
          { type: "placeholder", shape: "console" },
        ],
      },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "synthetic-plant",
    title: "Synthetic Plant",
    type: "Generative",
    year: "2024",
    client: "Personal Study",
    duration: "00:21",
    featured: true,
    ratio: "square",
    accent: "from-green-100 via-lime-200 to-yellow-100",
    shape: "plant",
    description: "Procedural leaves, staged botanical forms and calm synthetic gardening.",
    subtitle: "A generative botanical study built as if it were a small product collection.",
    tools: ["Cinema 4D", "Houdini", "Generative Forms", "Octane"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Project note",
        columns: [
          "This is the reference project for the current template: large visual blocks, short explanation, tool tags and a clean path to the next case.",
          "To turn it into a real case, replace only the data object and media files. The page itself should not require layout edits.",
        ],
      },
      {
        type: "mediaGrid",
        items: [
          { type: "placeholder", shape: "plant" },
          { type: "placeholder", shape: "totem" },
        ],
      },
      { type: "process", items: reusableProcess },
      {
        type: "credits",
        items: [
          { label: "Role", value: "Generative forms, lookdev, art direction" },
          { label: "Outputs", value: "Hero renders, crops, motion-ready assets" },
        ],
      },
    ],
  },
  {
    slug: "scan-cleanup",
    title: "Scan Cleanup",
    type: "Pipeline",
    year: "2024",
    client: "Production Pipeline",
    duration: "00:24",
    featured: false,
    ratio: "wide",
    accent: "from-stone-100 via-zinc-200 to-slate-300",
    shape: "scan",
    description: "Photogrammetry cleanup, remeshing and production-ready asset preparation.",
    subtitle: "A practical pipeline for turning messy scans into usable assets.",
    tools: ["Blender", "Photogrammetry", "Retopo", "Pipeline"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Pipeline",
        columns: [
          "Technical projects can be presented through before-after images, diagrams, viewport captures and short production notes.",
          "The goal is to make the value understandable without exposing internal client files or private production details.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "scan" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "digital-cloth",
    title: "Digital Cloth",
    type: "Lookdev",
    year: "2023",
    client: "Personal Study",
    duration: "00:28",
    featured: false,
    ratio: "portrait",
    accent: "from-sky-100 via-indigo-100 to-pink-100",
    shape: "cloth",
    description: "A set of fabric surfaces for close-up shots, folds and soft reflections.",
    subtitle: "A tactile lookdev exercise for fabric-heavy visuals.",
    tools: ["Marvelous", "C4D", "Redshift"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Surface",
        columns: [
          "This layout can hold soft material tests: details, close-ups, procedural variations and final campaign-style frames.",
          "A short caption is usually enough when the visual result is the main proof.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "cloth" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "object-index",
    title: "Object Index",
    type: "Database",
    year: "2023",
    client: "Internal Tooling",
    duration: "00:31",
    featured: false,
    ratio: "square",
    accent: "from-yellow-100 via-orange-100 to-red-100",
    shape: "stack",
    description: "A visual archive of modular 3D assets, tags and production metadata.",
    subtitle: "A database-first approach to reusable 3D content.",
    tools: ["Python", "Asset Library", "Metadata"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Asset logic",
        columns: [
          "Some portfolio items are not just final visuals, but systems: naming, metadata, categorization, previews and repeatable outputs.",
          "This case type can show interface captures, data diagrams or output sheets alongside visual results.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "stack" }, size: "large" },
      { type: "process", items: reusableProcess },
    ],
  },
  {
    slug: "future-console",
    title: "Future Console",
    type: "Interface",
    year: "2023",
    client: "Prototype",
    duration: "00:34",
    featured: false,
    ratio: "wide",
    accent: "from-violet-100 via-slate-200 to-cyan-100",
    shape: "console",
    description: "Interface-like 3D panels for product explainers and tech presentations.",
    subtitle: "A small UI/3D hybrid kit for technical storytelling.",
    tools: ["Figma", "Spline", "React", "Interface"],
    cover: { type: "placeholder" },
    hero: { type: "placeholder" },
    blocks: [
      {
        type: "text",
        label: "Interface",
        columns: [
          "Hybrid UI/3D cases benefit from a project page that can combine screenshots, 3D renders, prototypes and system explanations.",
          "The same data structure can describe a static render, an interactive mockup or a production-ready interface system.",
        ],
      },
      { type: "media", media: { type: "placeholder", shape: "console" }, size: "large" },
      { type: "process", items: reusableProcess },
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

export function getProject(slug) {
  return projects.find((project) => project.slug === slug);
}

export function getNextProject(slug) {
  const currentIndex = projects.findIndex((project) => project.slug === slug);
  return projects[(currentIndex + 1) % projects.length];
}