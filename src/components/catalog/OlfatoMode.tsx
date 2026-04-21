"use client";

interface FamilyBlock {
  key: string; // matches ?familia= param
  label: string;
  tagline: string;
  icon: string;
  bg: string;
  count: number;
}

interface OlfatoModeProps {
  counts: Record<string, number>; // key → product count
  onSelectFamily: (key: string) => void;
}

const FAMILIES: Omit<FamilyBlock, "count">[] = [
  {
    key: "oriental",
    label: "Oriental",
    tagline: "Misterioso",
    icon: "🟤",
    bg: "#2C1810",
  },
  {
    key: "amaderado",
    label: "Amaderado",
    tagline: "Natural",
    icon: "🪵",
    bg: "#1A2415",
  },
  {
    key: "floral",
    label: "Floral",
    tagline: "Romántico",
    icon: "🌸",
    bg: "#2A1525",
  },
  {
    key: "fresco",
    label: "Fresco · Cítrico",
    tagline: "Energizante",
    icon: "🍋",
    bg: "#101E2A",
  },
  {
    key: "gourmand",
    label: "Gourmand",
    tagline: "Seductor",
    icon: "🍫",
    bg: "#251508",
  },
];

export function OlfatoMode({ counts, onSelectFamily }: OlfatoModeProps) {
  const blocks: FamilyBlock[] = FAMILIES.map((f) => ({
    ...f,
    count: counts[f.key] ?? 0,
  }));

  const [oriental, amaderado, floral, fresco, gourmand] = blocks;

  const Block = ({ b, large }: { b: FamilyBlock; large?: boolean }) => (
    <button
      type="button"
      onClick={() => onSelectFamily(b.key)}
      className="group relative w-full h-full overflow-hidden transition-[filter] duration-300 hover:brightness-[1.2] focus:brightness-[1.2]"
      style={{ backgroundColor: b.bg }}
    >
      {/* Content centered */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
        <span className="text-3xl sm:text-4xl mb-3" aria-hidden>
          {b.icon}
        </span>
        <h3
          className={`font-serif text-white leading-none mb-2 ${
            large ? "text-3xl sm:text-4xl lg:text-5xl" : "text-2xl sm:text-3xl"
          }`}
        >
          {b.label}
        </h3>
        <p className="font-serif italic text-[#C9A96E] text-sm sm:text-base mb-4">
          {b.tagline}
        </p>
        <p className="text-[10px] uppercase tracking-[0.25em] text-white/70">
          {b.count} {b.count === 1 ? "fragancia" : "fragancias"}
        </p>
      </div>

      {/* subtle corner accent */}
      <span
        className="absolute top-3 left-3 text-[9px] uppercase tracking-[0.2em] text-white/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        aria-hidden
      >
        Explorar →
      </span>
    </button>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 grid-rows-[repeat(3,minmax(220px,1fr))] sm:grid-rows-[repeat(2,minmax(260px,1fr))] gap-px bg-black">
      {/* Row 1 — 2 large blocks */}
      {oriental && <Block b={oriental} large />}
      {amaderado && <Block b={amaderado} large />}
      {/* Row 2 — 2 medium blocks */}
      {floral && <Block b={floral} />}
      {fresco && <Block b={fresco} />}
      {/* Row 3 — gourmand full-width */}
      {gourmand && (
        <div className="sm:col-span-2">
          <Block b={gourmand} />
        </div>
      )}
    </div>
  );
}
