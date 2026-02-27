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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-2">
        Novedades del mundo perfume
      </h1>
      <p className="text-[var(--text-muted)] mb-10">
        Últimos lanzamientos, reformulaciones y tendencias.
      </p>
      <Suspense fallback={<div className="py-12 text-center text-[var(--text-muted)]">Cargando...</div>}>
        <NewsClient initialNews={initialNews} />
      </Suspense>
    </div>
  );
}
