import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";

interface SimilarProductsProps {
  productId: string;
  family: string | null;
  brand: string | null;
}

export async function SimilarProducts({
  productId,
  family,
  brand,
}: SimilarProductsProps) {
  const similar = await prisma.product.findMany({
    where: {
      id: { not: productId },
      OR: [
        ...(family ? [{ family }] : []),
        ...(brand ? [{ brand }] : []),
      ].filter(Boolean),
    },
    take: 4,
  });

  if (similar.length === 0) return null;

  return (
    <section className="mt-16 border-t border-[var(--border)] pt-12">
      <h2 className="text-xs font-medium uppercase tracking-wider text-[var(--text-muted)] mb-6">
        Similares
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {similar.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
