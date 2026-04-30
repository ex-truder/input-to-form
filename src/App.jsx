import React, { useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  Navigate,
  NavLink,
  Route,
  Routes,
  useLocation,
  useParams,
} from "react-router-dom";

const site = {
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

const reusableProcess = [
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

const projects = [
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

const filters = [
  "All",
  ...Array.from(new Set(projects.map((project) => project.type))),
];

function ScrollToTop() {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);

  return null;
}

function getProject(slug) {
  return projects.find((project) => project.slug === slug);
}

function getNextProject(slug) {
  const currentIndex = projects.findIndex((project) => project.slug === slug);
  return projects[(currentIndex + 1) % projects.length];
}

function Shape({ kind }) {
  const base =
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition duration-500 group-hover:scale-110 group-hover:rotate-3";

  if (kind === "pencil") {
    return (
      <div className={`${base} h-[74%] w-16 rotate-[22deg] rounded-full bg-yellow-500 shadow-2xl`}>
        <div className="absolute left-0 top-4 h-8 w-full bg-zinc-800/80" />
        <div className="absolute -top-7 left-1/2 h-9 w-12 -translate-x-1/2 rounded-t-full bg-pink-300" />
        <div className="absolute bottom-0 left-1/2 h-16 w-20 -translate-x-1/2 translate-y-8 rounded-[2rem] bg-zinc-700/80 blur-[1px]" />
      </div>
    );
  }

  if (kind === "ribbon") {
    return <div className={`${base} h-28 w-[72%] rounded-full bg-white/40 shadow-2xl backdrop-blur-md`} />;
  }

  if (kind === "totem") {
    return (
      <div className={`${base} flex h-[76%] w-24 flex-col items-center justify-center gap-3`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-20 rounded-[1.25rem] border border-white/50 bg-white/35 shadow-xl backdrop-blur" />
        ))}
      </div>
    );
  }

  if (kind === "box") {
    return <div className={`${base} h-44 w-44 rotate-12 rounded-[2rem] bg-white/45 shadow-2xl backdrop-blur-md`} />;
  }

  if (kind === "blob") {
    return <div className={`${base} h-56 w-64 rounded-[45%_55%_60%_40%] bg-white/35 shadow-2xl blur-[0.3px] backdrop-blur-md`} />;
  }

  if (kind === "grid") {
    return (
      <div className={`${base} grid h-60 w-60 grid-cols-3 gap-3`}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="rounded-2xl bg-white/40 shadow-lg backdrop-blur" />
        ))}
      </div>
    );
  }

  if (kind === "plant") {
    return (
      <div className={`${base} h-64 w-44`}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 h-20 w-28 origin-left rounded-full bg-white/35 shadow-xl backdrop-blur"
            style={{ transform: `rotate(${i * 46}deg) translateX(10px)` }}
          />
        ))}
        <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/60 shadow-xl" />
      </div>
    );
  }

  if (kind === "scan") {
    return <div className={`${base} h-56 w-56 rounded-full border-[18px] border-white/45 shadow-2xl`} />;
  }

  if (kind === "cloth") {
    return <div className={`${base} h-52 w-72 rounded-[50%_20%_55%_25%] bg-white/30 shadow-2xl backdrop-blur-md`} />;
  }

  if (kind === "stack") {
    return (
      <div className={`${base} h-56 w-56`}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute h-44 w-44 rounded-[2rem] bg-white/35 shadow-2xl backdrop-blur"
            style={{ left: i * 26, top: i * 28 }}
          />
        ))}
      </div>
    );
  }

  if (kind === "console") {
    return (
      <div className={`${base} h-40 w-[78%] rounded-[2rem] bg-zinc-950/70 p-4 shadow-2xl backdrop-blur`}>
        <div className="mb-4 h-4 w-1/2 rounded-full bg-white/40" />
        <div className="grid grid-cols-5 gap-2">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-5 rounded-md bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  return <div className={`${base} h-52 w-52 rounded-full bg-white/35 shadow-2xl backdrop-blur-md`} />;
}

function PlaceholderVisual({ project, media, className = "min-h-[420px]" }) {
  const shape = media?.shape || project?.shape || "orb";
  const accent = media?.accent || project?.accent || "from-neutral-100 via-neutral-300 to-neutral-500";

  return (
    <div className={`group relative overflow-hidden rounded-[2rem] bg-gradient-to-br ${accent} ${className}`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.65),transparent_34%),radial-gradient(circle_at_80%_90%,rgba(0,0,0,0.14),transparent_30%)]" />
      <Shape kind={shape} />
    </div>
  );
}

function ProjectMedia({ media, project, className = "min-h-[420px]", priority = false }) {
  const [failed, setFailed] = useState(false);

  if (!media || media.type === "placeholder" || !media.src || failed) {
    return <PlaceholderVisual project={project} media={media} className={className} />;
  }

  if (media.type === "video") {
    return (
      <div className={`relative overflow-hidden rounded-[2rem] bg-zinc-200 ${className}`}>
        <video
          src={media.src}
          poster={media.poster}
          autoPlay={media.autoPlay ?? true}
          muted={media.muted ?? true}
          loop={media.loop ?? true}
          playsInline
          controls={media.controls ?? false}
          onError={() => setFailed(true)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-[2rem] bg-zinc-200 ${className}`}>
      <img
        src={media.src}
        alt={media.alt || project?.title || "Project media"}
        loading={priority ? "eager" : "lazy"}
        onError={() => setFailed(true)}
        className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
      />
    </div>
  );
}

function Header() {
  const navLinkClass = ({ isActive }) =>
    `hover:opacity-50 ${isActive ? "opacity-100" : "opacity-70"}`;

  return (
    <header className="sticky top-0 z-30 border-b border-zinc-950/10 bg-[#f6f3ec]/85 px-5 py-4 backdrop-blur-xl md:px-8">
      <nav className="mx-auto flex max-w-[1600px] items-center justify-between gap-6 text-sm font-medium uppercase tracking-[0.08em]">
        <Link to="/" className="text-lg font-black tracking-tight normal-case">
          {site.title}
        </Link>
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
        <NavLink to="/work" className="md:hidden">
          Work
        </NavLink>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-zinc-950/10 px-5 py-10 md:px-8">
      <div className="mx-auto grid max-w-[1600px] gap-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <a href={`mailto:${site.email}`} className="mb-4 block text-left text-3xl font-black tracking-tight md:text-5xl">
            {site.email}
          </a>
          <p className="max-w-xl text-zinc-600">{site.description}</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm font-semibold uppercase tracking-[0.08em]">
          {site.socials.map((social) => (
            <a key={social.label} href={social.href} className="hover:opacity-50">
              {social.label}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

function ProjectCard({ project, index }) {
  const ratio =
    project.ratio === "portrait"
      ? "md:row-span-2 min-h-[520px]"
      : project.ratio === "wide"
        ? "md:col-span-2 min-h-[360px]"
        : "min-h-[360px]";

  return (
    <Link to={`/work/${project.slug}`} className="block" style={{ animationDelay: `${index * 50}ms` }}>
      <article className={`group relative overflow-hidden rounded-[2rem] ${ratio}`}>
        <ProjectMedia media={project.cover} project={project} className="absolute inset-0 min-h-0 h-full rounded-none" />
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-5 opacity-0 transition duration-300 group-hover:opacity-100">
          <div className="rounded-2xl bg-white/70 px-4 py-3 text-sm backdrop-blur-md">
            <h3 className="font-semibold tracking-tight text-zinc-950">{project.title}</h3>
            <p className="mt-1 text-zinc-600">{project.type}</p>
          </div>
          <span className="rounded-full bg-zinc-950 px-4 py-2 text-xs font-medium uppercase tracking-wider text-white">
            Open
          </span>
        </div>
      </article>
    </Link>
  );
}

function HomePage() {
  const [active, setActive] = useState("All");

  const visibleProjects = useMemo(() => {
    if (active === "All") return projects;
    return projects.filter((project) => project.type === active);
  }, [active]);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 md:px-8 md:pb-12 md:pt-24">
        <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr] md:items-end">
          <h1 className="max-w-5xl text-[16vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[9.4vw]">
            I&apos;d like this to be my 3D CV
          </h1>
          <div className="max-w-xl justify-self-end text-balance text-lg leading-relaxed text-zinc-700 md:text-xl">
            A minimal portfolio template for procedural 3D, product visuals, simulations and interactive visual systems. Big visuals first, explanations only where they help.
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/work" className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-white">
                View projects
              </Link>
              <a href={`mailto:${site.email}`} className="rounded-full border border-zinc-950/15 px-5 py-3 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-800">
                Contact
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActive(filter)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                active === filter
                  ? "border-zinc-950 bg-zinc-950 text-white"
                  : "border-zinc-950/15 bg-white/30 text-zinc-700 hover:border-zinc-950/50"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="grid auto-rows-[180px] grid-cols-1 gap-5 md:grid-cols-3 xl:grid-cols-4">
          {visibleProjects.map((project, index) => (
            <ProjectCard key={`${project.slug}-${active}`} project={project} index={index} />
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-[1600px] gap-8 px-5 py-24 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-32">
        <h2 className="text-5xl font-black uppercase leading-none tracking-[-0.05em] md:text-8xl">From input to form</h2>
        <div className="grid gap-8 text-lg leading-relaxed text-zinc-700 md:grid-cols-2">
          <p>
            You bring sketches, CAD, scans, briefs, datasets or a vague idea. I build the visual system: models, renders, motion, technical assets and interactive prototypes.
          </p>
          <p>
            The site is now data-driven: add a folder with media, add one object to the projects array, and the homepage, work list and project page update automatically.
          </p>
        </div>
      </section>
    </>
  );
}

function WorkIndexPage() {
  const featuredProject = projects.find((project) => project.featured) || projects[0];

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-16 md:px-8 md:pb-14 md:pt-24">
        <div className="grid gap-10 md:grid-cols-[1fr_0.75fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">Work collection</p>
            <h1 className="max-w-5xl text-[18vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[10vw]">
              I love 3D
            </h1>
          </div>
          <div className="max-w-xl text-lg leading-relaxed text-zinc-700 md:text-xl">
            A curated project list: personal studies, commercial-looking systems, procedural experiments and asset pipelines. Some projects are visual, some are technical, most are somewhere in between.
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <Link to={`/work/${featuredProject.slug}`} className="text-left">
            <ProjectMedia media={featuredProject.cover} project={featuredProject} className="min-h-[560px]" priority />
            <div className="mt-5 grid gap-2 md:grid-cols-[auto_1fr] md:items-baseline md:gap-8">
              <p className="font-mono text-sm text-zinc-500">00:00</p>
              <div>
                <h2 className="text-3xl font-black tracking-[-0.04em] md:text-5xl">Featured Opening</h2>
                <p className="mt-2 text-zinc-600">{featuredProject.description}</p>
              </div>
            </div>
          </Link>

          <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-4 backdrop-blur md:p-6">
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-[-0.04em]">Go to Projects</h2>
              <span className="rounded-full bg-zinc-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-white">
                {projects.length}
              </span>
            </div>

            <div className="divide-y divide-zinc-950/10">
              {projects.map((project) => (
                <Link
                  key={project.slug}
                  to={`/work/${project.slug}`}
                  className="group grid w-full grid-cols-[4.5rem_1fr_auto] gap-4 py-4 text-left transition hover:pl-2"
                >
                  <span className="font-mono text-sm text-zinc-500">{project.duration}</span>
                  <span>
                    <span className="block font-semibold text-zinc-950">{project.title}</span>
                    <span className="mt-1 block text-sm text-zinc-500">{project.description}</span>
                  </span>
                  <span className="self-center rounded-full border border-zinc-950/10 px-3 py-1 text-xs uppercase tracking-[0.08em] text-zinc-500 group-hover:border-zinc-950 group-hover:text-zinc-950">
                    Open
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 py-24 md:px-8">
        <div className="rounded-[2rem] bg-zinc-950 p-6 text-white md:p-10">
          <div className="grid gap-8 md:grid-cols-[0.8fr_1.2fr] md:items-end">
            <h2 className="text-5xl font-black uppercase leading-none tracking-[-0.06em] md:text-8xl">Mostly NDA-friendly</h2>
            <p className="max-w-2xl text-lg leading-relaxed text-white/70">
              The public version focuses on process, taste and production logic. Real client materials can be swapped in later as images, videos or protected case studies.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}

function TextBlock({ block }) {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-10 px-5 py-16 md:grid-cols-[0.65fr_1.35fr] md:px-8 md:py-24">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">{block.label || "Project note"}</p>
      </div>
      <div className="grid gap-8 text-xl leading-relaxed text-zinc-700 md:grid-cols-2">
        {block.columns?.map((column, index) => (
          <p key={index}>{column}</p>
        ))}
      </div>
    </section>
  );
}

function MediaBlock({ block, project }) {
  const sizeClass = block.size === "large" ? "min-h-[72vh]" : "min-h-[520px]";

  return (
    <section className="mx-auto max-w-[1600px] px-5 py-5 md:px-8">
      <ProjectMedia media={block.media} project={project} className={sizeClass} />
      {block.caption && <p className="mt-3 text-sm text-zinc-500">{block.caption}</p>}
    </section>
  );
}

function MediaGridBlock({ block, project }) {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-5 px-5 py-5 md:grid-cols-2 md:px-8">
      {block.items?.map((item, index) => (
        <ProjectMedia key={index} media={item} project={project} className="min-h-[520px]" />
      ))}
    </section>
  );
}

function ProcessBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="rounded-[2rem] border border-zinc-950/10 bg-white/35 p-6 md:p-10">
        <h2 className="mb-6 text-4xl font-black tracking-[-0.05em] md:text-7xl">Process</h2>
        <div className="grid gap-6 text-zinc-700 md:grid-cols-3">
          {block.items?.map((item, index) => (
            <p key={item.title}>
              <strong className="text-zinc-950">{String(index + 1).padStart(2, "0")}. {item.title}</strong>
              <br />
              {item.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

function QuoteBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <blockquote className="max-w-5xl text-4xl font-black leading-none tracking-[-0.06em] text-zinc-950 md:text-8xl">
        “{block.text}”
      </blockquote>
    </section>
  );
}

function CreditsBlock({ block }) {
  return (
    <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
      <div className="grid gap-3 rounded-[2rem] bg-zinc-950 p-6 text-white md:grid-cols-2 md:p-10">
        {block.items?.map((item) => (
          <div key={item.label} className="border-t border-white/15 pt-4">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-white/40">{item.label}</p>
            <p className="text-xl text-white/85">{item.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProjectBlocks({ project }) {
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

function ProjectPage() {
  const { slug } = useParams();
  const project = getProject(slug);

  if (!project) {
    return <Navigate to="/work" replace />;
  }

  const nextProject = getNextProject(project.slug);

  return (
    <>
      <section className="mx-auto max-w-[1600px] px-5 pb-8 pt-12 md:px-8 md:pb-14 md:pt-20">
        <Link to="/work" className="mb-10 inline-flex rounded-full border border-zinc-950/15 px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-600 hover:border-zinc-950 hover:text-zinc-950">
          ← Back to work
        </Link>

        <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-[0.16em] text-zinc-500">
              {project.type} / {project.year} / {project.client}
            </p>
            <h1 className="text-[17vw] font-black uppercase leading-[0.78] tracking-[-0.08em] md:text-[9vw]">
              {project.title}
            </h1>
          </div>
          <div className="max-w-xl text-lg leading-relaxed text-zinc-700 md:text-xl">
            <p className="mb-6 font-semibold text-zinc-950">{project.subtitle}</p>
            <div className="flex flex-wrap gap-2">
              {project.tools.map((tool) => (
                <span key={tool} className="rounded-full border border-zinc-950/15 px-3 py-1 text-sm text-zinc-600">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1600px] px-5 md:px-8">
        <ProjectMedia media={project.hero} project={project} className="min-h-[72vh]" priority />
      </section>

      <ProjectBlocks project={project} />

      <section className="mx-auto max-w-[1600px] px-5 py-16 md:px-8 md:py-24">
        <Link to={`/work/${nextProject.slug}`} className="group block rounded-[2rem] bg-zinc-950 p-6 text-white md:p-10">
          <p className="mb-12 text-sm font-semibold uppercase tracking-[0.16em] text-white/50">Next project</p>
          <h3 className="text-4xl font-black uppercase leading-none tracking-[-0.05em] md:text-6xl">{nextProject.title}</h3>
          <p className="mt-4 max-w-xl text-white/60">{nextProject.description}</p>
          <span className="mt-10 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold uppercase tracking-[0.08em] text-zinc-950 transition group-hover:translate-x-2">
            Open →
          </span>
        </Link>
      </section>
    </>
  );
}

function AboutPage() {
  return (
    <section className="mx-auto grid max-w-[1600px] gap-8 px-5 py-24 md:grid-cols-[0.8fr_1.2fr] md:px-8 md:py-32">
      <h1 className="text-6xl font-black uppercase leading-none tracking-[-0.06em] md:text-9xl">About</h1>
      <div className="grid gap-8 text-xl leading-relaxed text-zinc-700 md:grid-cols-2">
        <p>
          I build procedural 3D systems, visual assets and interactive prototypes from vague inputs: sketches, datasets, geometry, product briefs and visual references.
        </p>
        <p>
          The public portfolio is intentionally compact because a lot of production work is unique, technical or NDA-constrained. The goal is to show taste, systems thinking and output quality.
        </p>
      </div>
    </section>
  );
}

function AppShell() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] text-zinc-950 selection:bg-zinc-950 selection:text-white">
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/work" element={<WorkIndexPage />} />
        <Route path="/work/:slug" element={<ProjectPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Footer />
    </main>
  );
}

export default function PortfolioPage() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AppShell />
    </BrowserRouter>
  );
}
