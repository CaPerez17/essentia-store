import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { NewsCard } from "@/components/news/NewsCard";

export default async function HomePage() {
  const [featured, newProducts, onSale, newsAll] = await Promise.all([
    prisma.product.findMany({
      where: { featured: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { isNew: true },
      take: 4,
    }),
    prisma.product.findMany({
      where: { onSale: true },
      take: 4,
    }),
    prisma.newsItem.findMany({
      orderBy: { publishedAt: "desc" },
      take: 5,
    }),
  ]);

  const newsFeatured = newsAll[0] ?? null;
  const newsSecondary = newsAll.slice(1, 5);

  return (
    <div>
      {/* Hero: minimal, no gradient */}
      <section className="border-b border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-medium tracking-tight text-[var(--text)] sm:text-4xl">
            Perfumería de autor
          </h1>
          <p className="mt-4 max-w-xl text-[var(--text-muted)]">
            Catálogo curado de nicho y diseñador. Descubre fragancias que cuentan historias.
          </p>
          <Link
            href="/catalogo"
            className="mt-6 inline-block border border-[var(--accent)] bg-[var(--accent)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            Ver catálogo
          </Link>
        </div>
      </section>

      {/* Destacados */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-6">
          Destacados
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Nuevos */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-6">
            Nuevos
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {newProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Ofertas */}
      <section className="border-t border-[var(--border)]">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-6">
            Ofertas
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {onSale.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* Novedades del mundo perfume - editorial block: 1 destacado + 4 secundarios */}
      <section className="border-t border-[var(--border)] bg-[var(--bg-card)]">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-2">
            Novedades del mundo perfume
          </h2>
          <p className="text-[var(--text-muted)] mb-10 max-w-2xl">
            Últimos lanzamientos, reformulaciones y tendencias del sector.
          </p>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {newsFeatured && (
              <div className="lg:col-span-2">
                <NewsCard item={newsFeatured} variant="featured" />
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
              {newsSecondary.map((n) => (
                <NewsCard key={n.id} item={n} variant="compact" />
              ))}
            </div>
          </div>
          <div className="mt-10">
            <Link
              href="/novedades"
              className="text-sm font-medium text-[var(--accent)] hover:underline"
            >
              Ver todas las novedades →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
