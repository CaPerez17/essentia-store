import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";

interface SimilarProductsProps {
  productId: string;
  family: string | null;
  brand: string | null;
  gender: string | null;
}

export async function SimilarProducts({
  productId,
  family,
  brand,
  gender,
}: SimilarProductsProps) {
  const orConditions: Array<Record<string, string>> = [];
  if (brand) orConditions.push({ brand });
  if (family) orConditions.push({ family });
  if (gender) orConditions.push({ gender });

  if (orConditions.length === 0) return null;

  const similar = await prisma.product.findMany({
    where: {
      id: { not: productId },
      OR: orConditions,
      images: { some: {} },
    },
    take: 4,
    include: { images: { orderBy: { position: "asc" } } },
  });

  if (similar.length === 0) return null;

  return (
    <section className="mt-20 pt-12" style={{ borderTop: "0.5px solid rgba(201,169,110,0.15)" }}>
      <div className="flex items-baseline justify-between mb-8">
        <h2 className="text-[10px] uppercase tracking-[0.25em] text-[var(--gold)]">
          También te puede interesar
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-px sm:grid-cols-4 bg-[rgba(201,169,110,0.06)]">
        {similar.map((p) => (
          <div key={p.id} className="bg-[var(--dark)]">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}
