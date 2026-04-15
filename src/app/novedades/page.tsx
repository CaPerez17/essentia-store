import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { NewsClient } from "./NewsClient";

export default async function NewsPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}) {
  const { categoria, q } = await searchParams;

  const where: { category?: string; title?: { contains: string } } = {};
  if (categoria) where.category = categoria;
  if (q?.trim()) where.title = { contains: q.trim() };

  const initialNews = await prisma.newsItem.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { publishedAt: "desc" },
  });

  return (
    <div className="bg-[var(--dark)]">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        <div className="mb-10">
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--cream)] mb-2">
            Novedades
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]/60">
            Lanzamientos, reformulaciones y tendencias del mundo perfume
          </p>
        </div>
        <Suspense
          fallback={
            <div className="py-24 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)]">Cargando...</p>
            </div>
          }
        >
          <NewsClient initialNews={initialNews} />
        </Suspense>
      </div>
    </div>
  );
}
