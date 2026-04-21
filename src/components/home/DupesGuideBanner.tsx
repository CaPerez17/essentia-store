import Link from "next/link";

const EXAMPLE_DUPES = [
  { original: "Dior Sauvage", dupe: "Afnan 9PM", saving: 70 },
  { original: "YSL Black Opium", dupe: "Lattafa Yara", saving: 65 },
  { original: "Creed Aventus", dupe: "Armaf Club de Nuit", saving: 85 },
  { original: "Chanel Coco Mademoiselle", dupe: "Armaf Club de Nuit Women", saving: 75 },
];

export function DupesGuideBanner() {
  return (
    <section className="bg-white py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: editorial copy */}
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-5">
              Guía · Essentia
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#0D0D0D] leading-[1.05] mb-6">
              El mismo aroma.
              <br />
              <span className="italic text-[#C9A96E]">Una fracción del precio.</span>
            </h2>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8 max-w-lg">
              Descubre alternativas árabes a los perfumes más icónicos del mundo. Nuestra IA analiza las notas olfativas y encuentra el dupe perfecto en nuestro catálogo.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dupe-finder"
                className="btn-primary inline-block bg-[#0D0D0D] text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
              >
                Buscar mi dupe →
              </Link>
              <Link
                href="/marcas?cat=arabe"
                className="btn-primary inline-block border border-[#0D0D0D] text-[#0D0D0D] px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-[#0D0D0D] hover:text-white transition-colors"
              >
                Ver árabes
              </Link>
            </div>
          </div>

          {/* Right: dupe comparison list */}
          <div className="bg-[#F5F0E8] p-8 sm:p-10">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] mb-5">
              Ejemplos populares
            </p>
            <ul className="space-y-4">
              {EXAMPLE_DUPES.map((d) => (
                <li
                  key={d.original}
                  className="flex items-center gap-4 py-3"
                  style={{ borderBottom: "1px solid rgba(201,169,110,0.2)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B] mb-0.5">
                      Original
                    </p>
                    <p className="font-serif text-sm text-[#0D0D0D] truncate">
                      {d.original}
                    </p>
                  </div>
                  <span className="font-serif text-xl text-[#C9A96E] shrink-0" aria-hidden>
                    →
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.15em] text-[#C9A96E] mb-0.5">
                      Dupe árabe
                    </p>
                    <p className="font-serif text-sm text-[#0D0D0D] truncate">
                      {d.dupe}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.1em] text-[#0D0D0D] bg-[#C9A96E] px-2 py-1">
                    -{d.saving}%
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[11px] text-[#6B6B6B] italic">
              Resultados generados por IA. Cada recomendación incluye porcentaje de similitud y notas coincidentes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
