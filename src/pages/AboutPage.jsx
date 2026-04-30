export default function AboutPage() {
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