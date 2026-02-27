import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export default async function SharedWishlistPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const share = await prisma.wishlistShare.findUnique({
    where: { token },
  });

  if (!share) notFound();

  const productIds = (() => {
    try {
      return JSON.parse(share.productIds) as string[];
    } catch {
      return [];
    }
  })();

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
  });

  const ordered = productIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p != null);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-2">
        Wishlist compartida
      </h1>
      <p className="text-[var(--text-muted)] mb-8">
        {ordered.length} {ordered.length === 1 ? "producto" : "productos"}
      </p>
      {ordered.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {ordered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p className="text-[var(--text-muted)] mb-6">
          Esta wishlist no contiene productos.
        </p>
      )}
      <div className="mt-10">
        <Link
          href="/catalogo"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Ver catálogo
        </Link>
      </div>
    </div>
  );
}
