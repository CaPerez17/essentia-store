"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { NewsCard } from "@/components/news/NewsCard";
import type { NewsItem } from "@prisma/client";

interface NewsClientProps {
  initialNews: NewsItem[];
}

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

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            updateParams({ q: (fd.get("q") as string) || "", categoria: category });
          }}
          className="flex flex-1 max-w-md gap-2"
        >
          <input
            type="search"
            name="q"
            placeholder="Buscar por título..."
            defaultValue={q}
            className="flex-1 border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
          />
          <button
            type="submit"
            className="border border-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-colors"
          >
            Buscar
          </button>
        </form>
        <select
          value={category}
          onChange={(e) => updateParams({ categoria: e.target.value, q })}
          className="w-full sm:w-48 border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
        >
          <option value="">Todas las categorías</option>
          <option value="niche">Nicho</option>
          <option value="designer">Diseñador</option>
          <option value="arab">Árabe</option>
        </select>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {initialNews.map((n) => (
          <NewsCard key={n.id} item={n} />
        ))}
      </div>
      {initialNews.length === 0 && (
        <p className="py-12 text-center text-[var(--text-muted)]">
          No hay novedades que coincidan.
        </p>
      )}
    </div>
  );
}
