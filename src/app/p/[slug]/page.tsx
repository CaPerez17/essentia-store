import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "./ProductGallery";
import { ProductActions } from "./ProductActions";
import { SimilarProducts } from "./SimilarProducts";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { images: { orderBy: { position: "asc" } } },
  });

  if (!product) notFound();

  const { getProductImageUrls } = await import("@/lib/product-images");
  const images = getProductImageUrls(product);

  const tags = (() => {
    try {
      return JSON.parse(product.tags || "[]") as string[];
    } catch {
      return [];
    }
  })();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-8 text-sm text-[var(--text-muted)]">
        <Link href="/catalogo" className="hover:text-[var(--text)]">
          Catálogo
        </Link>
        <span className="mx-2">/</span>
        <span>{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ProductGallery images={images} productName={product.name} brand={product.brand} />
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-muted)] mb-1">
            {product.brand}
          </p>
          <h1 className="text-2xl font-medium tracking-tight text-[var(--text)] mb-4">
            {product.name}
          </h1>
          <ProductActions product={product} />
          {product.description && (
            <p className="mt-6 text-[var(--text-muted)]">{product.description}</p>
          )}
          {tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="border border-[var(--border)] px-2 py-1 text-xs text-[var(--text-muted)]"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            {product.stock > 0 ? (
              <span>En stock ({product.stock} unidades)</span>
            ) : (
              <span>Sin stock</span>
            )}
          </p>
        </div>
      </div>

      <SimilarProducts
        productId={product.id}
        family={product.family}
        brand={product.brand}
      />
    </div>
  );
}
