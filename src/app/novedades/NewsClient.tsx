"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsItem } from "@prisma/client";

interface NewsClientProps {
  initialNews: NewsItem[];
}

const categories = [
  { value: "", label: "Todas" },
  { value: "niche", label: "Nicho" },
  { value: "designer", label: "Diseñador" },
  { value: "arab", label: "Árabe" },
];

export function NewsClient({ initialNews }: NewsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const category = searchParams.get("categoria") || "";
  const q = searchParams.get("q") || "";

  const updateParams = (updates: { categoria?: string; q?: string }) => {
    const sp = new URLSearchParams();
    const cat = updates.categoria ?? category;
    const query = updates.q ?? q;
    if (cat) sp.set("categoria", cat);
    if (query) sp.set("q", query);
    const qs = sp.toString();
    router.push(qs ? `/novedades?${qs}` : "/novedades", { scroll: false });
  };

  const featured = initialNews[0] ?? null;
  const rest = initialNews.slice(1);

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center mb-10">
        {/* Category chips */}
        <div className="flex gap-2">
          {categories.map((cat) => (
            <button
              key={cat.value}
              type="button"
              onClick={() => updateParams({ categoria: cat.value, q })}
              className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.15em] border transition-colors duration-200 ${
                category === cat.value
                  ? "border-[var(--gold)] bg-[var(--gold)]/10 text-[var(--gold)]"
                  : "border-[var(--gold-border)] text-[var(--muted)] hover:border-[var(--gold)]/50 hover:text-[var(--cream)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParams({ q: (fd.get("q") as string) || "", categoria: category });
          }}
          className="flex sm:ml-auto max-w-xs gap-2"
        >
          <input
            type="search"
            name="q"
            placeholder="Buscar..."
            defaultValue={q}
            className="flex-1 bg-transparent border border-[var(--gold-border)] px-3 py-2 text-xs text-[var(--cream)] placeholder:text-[var(--muted)]/50 focus:outline-none focus:border-[var(--gold)]"
          />
          <button
            type="submit"
            className="border border-[var(--gold-border)] px-4 py-2 text-[9px] uppercase tracking-[0.15em] text-[var(--gold)] transition-colors duration-200 hover:border-[var(--gold)] hover:bg-[var(--gold)]/5"
          >
            Buscar
          </button>
        </form>
      </div>

      {/* Featured + grid */}
      {featured && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-px bg-[rgba(201,169,110,0.06)] mb-px">
          {/* Featured takes 3 cols */}
          <div className="lg:col-span-3 bg-[var(--dark)]">
            <NewsCard item={featured} variant="featured" />
          </div>
          {/* Side stack takes 2 cols */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-px bg-[rgba(201,169,110,0.06)]">
            {rest.slice(0, 2).map((n) => (
              <div key={n.id} className="bg-[var(--dark)]">
                <NewsCard item={n} variant="compact" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest grid */}
      {rest.length > 2 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[rgba(201,169,110,0.06)] mt-px">
          {rest.slice(2).map((n) => (
            <div key={n.id} className="bg-[var(--dark)]">
              <NewsCard item={n} />
            </div>
          ))}
        </div>
      )}

      {initialNews.length === 0 && (
        <div className="py-24 text-center">
          <p className="font-serif text-xl text-[var(--cream)] mb-2">
            Sin novedades
          </p>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">
            Prueba con otra categoría o búsqueda
          </p>
        </div>
      )}
    </div>
  );
}
