import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductGallery } from "./ProductGallery";
import { ProductActions } from "./ProductActions";
import { SimilarProducts } from "./SimilarProducts";
import { ScentPyramid } from "./ScentPyramid";
import { StickyAddToCart } from "@/components/product/StickyAddToCart";
import {
  getScentNotes,
  generateDescription,
  getFamilyBackgroundLight,
} from "@/lib/scent-notes";

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

  const notes = getScentNotes(product.family, product.gender);
  const description =
    product.description ||
    generateDescription(product.brand, product.name, product.family, product.gender);

  const genderLabel: Record<string, string> = {
    masculine: "Masculino",
    feminine: "Femenino",
    unisex: "Unisex",
  };

  // Extract volume from tags
  const volume = tags.find((t) => /^\d+ml$/i.test(t) || t.toLowerCase() === "set") || null;

  return (
    <div className="bg-[var(--dark)] min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-20 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-8 flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-[var(--muted)]">
          <Link href="/" className="hover:text-[var(--gold)] transition-colors">
            Inicio
          </Link>
          <span className="text-[var(--gold)]/30">/</span>
          <Link href="/catalogo" className="hover:text-[var(--gold)] transition-colors">
            Catálogo
          </Link>
          <span className="text-[var(--gold)]/30">/</span>
          <Link
            href={`/catalogo?marca=${encodeURIComponent(product.brand)}`}
            className="hover:text-[var(--gold)] transition-colors"
          >
            {product.brand}
          </Link>
          <span className="text-[var(--gold)]/30">/</span>
          <span className="text-[var(--cream)] truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Main: gallery + info */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
          {/* Gallery sticky */}
          <ProductGallery
            images={images}
            productName={product.name}
            brand={product.brand}
            familyBg={getFamilyBackgroundLight(product.tags, product.gender)}
          />

          {/* Info */}
          <div>
            {/* Eyebrow: brand */}
            <p className="text-[9px] uppercase tracking-[0.3em] text-[var(--gold)] mb-4">
              {product.brand}
            </p>

            {/* Title */}
            <h1 className="font-serif text-4xl sm:text-5xl font-light text-[var(--cream)] leading-[1.05] mb-6">
              {product.name}
            </h1>

            {/* Attribute chips */}
            <div className="flex flex-wrap gap-2 mb-8">
              {product.gender && (
                <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)] border border-[var(--gold-border)] px-3 py-1">
                  {genderLabel[product.gender] || product.gender}
                </span>
              )}
              {volume && (
                <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)] border border-[var(--gold-border)] px-3 py-1">
                  {volume}
                </span>
              )}
              {product.family && (
                <span className="text-[9px] uppercase tracking-[0.15em] text-[var(--gold)] border border-[var(--gold-border)] px-3 py-1 capitalize">
                  {product.family}
                </span>
              )}
            </div>

            {/* Editorial description */}
            <p className="font-serif italic text-base text-[var(--muted)] leading-relaxed mb-10 border-l border-[var(--gold-border)] pl-5">
              {description}
            </p>

            {/* Price + actions + trust */}
            <ProductActions product={product} />

            {/* Scent pyramid */}
            <ScentPyramid notes={notes} />
          </div>
        </div>

        {/* Related products */}
        <SimilarProducts
          productId={product.id}
          family={product.family}
          brand={product.brand}
          gender={product.gender}
        />
      </div>

      {/* Sticky add-to-cart (mobile only) */}
      <StickyAddToCart product={product} />
    </div>
  );
}
