export default function Shape({ kind }) {
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