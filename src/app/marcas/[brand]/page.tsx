import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { resolveImageUrl } from "@/lib/image-url";
import {
  BRAND_CATEGORY_LABELS,
  brandDescription,
  brandSlug,
  categorizeBrand,
} from "@/lib/brands";

interface PageProps {
  params: Promise<{ brand: string }>;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

// Build lookup once
async function resolveBrandFromSlug(
  slug: string,
): Promise<{ brand: string; count: number } | null> {
  const groups = await prisma.product.groupBy({
    by: ["brand"],
    _count: { brand: true },
  });
  const match = groups.find((g) => brandSlug(g.brand) === slug);
  return match ? { brand: match.brand, count: match._count.brand } : null;
}

export async function generateMetadata({ params }: PageProps) {
  const { brand } = await params;
  const resolved = await resolveBrandFromSlug(brand);
  if (!resolved) {
    return { title: "Marca no encontrada | Essentia" };
  }
  return {
    title: `${resolved.brand} en Colombia | Essentia Perfumería`,
    description: `Compra perfumes originales de ${resolved.brand} en Colombia. ${resolved.count} fragancias disponibles con envío a todo el país.`,
  };
}

export default async function BrandDetailPage({ params }: PageProps) {
  const { brand: slug } = await params;
  const resolved = await resolveBrandFromSlug(slug);
  if (!resolved) notFound();

  const brandName = resolved.brand;
  const category = categorizeBrand(brandName);
  const description = brandDescription(brandName, category);

  const products = await prisma.product.findMany({
    where: { brand: { equals: brandName, mode: "insensitive" } },
    include: { images: { orderBy: { position: "asc" } } },
    orderBy: { price: "asc" },
    take: 50,
  });

  if (products.length === 0) notFound();

  // 3 hero images for collage (unique products with images)
  const heroImages = products
    .filter((p) => p.images.length > 0)
    .slice(0, 3)
    .map((p) => ({
      url: resolveImageUrl(p.images[0]!.key),
      name: p.name,
    }));

  const minPrice = products[0]?.price ?? 0;

  const topBrandsWithEditorial = [
    "afnan",
    "armaf",
    "xerjoff",
    "creed",
    "le labo",
    "lattafa",
    "dior",
    "chanel",
  ];
  const showEditorial = topBrandsWithEditorial.includes(
    brandName.toLowerCase().trim(),
  );

  const categoryBadgeClass =
    category === "arabe"
      ? "bg-[#251508] text-[#C9A96E]"
      : category === "nicho"
        ? "bg-[#0D0D0D] text-white border border-[#C9A96E]/40"
        : "bg-white text-[#0D0D0D]";

  return (
    <div className="bg-white min-h-screen">
      {/* ═══ Editorial dark header ═══ */}
      <section className="bg-[#0D0D0D] relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-center">
            {/* Left: info */}
            <div>
              {/* Breadcrumb */}
              <nav className="mb-6 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                <Link
                  href="/marcas"
                  className="hover:text-[#C9A96E] transition-colors"
                >
                  Marcas
                </Link>
                <span className="text-[#C9A96E]/40">/</span>
                <span className="text-[#C9A96E]">{brandName}</span>
              </nav>

              <h1 className="font-serif text-5xl sm:text-6xl lg:text-[72px] font-light text-white leading-[1.02] mb-5">
                {brandName}
              </h1>

              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span
                  className={`text-[9px] uppercase tracking-[0.25em] px-3 py-1.5 ${categoryBadgeClass}`}
                >
                  {BRAND_CATEGORY_LABELS[category]}
                </span>
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                  {products.length} fragancias · Desde {fmt(minPrice)}
                </span>
              </div>

              <p className="font-serif italic text-base sm:text-lg text-[#C9A96E]/80 leading-relaxed max-w-xl border-l border-[#C9A96E]/30 pl-5">
                {description}
              </p>
            </div>

            {/* Right: collage */}
            <div className="relative hidden lg:block h-[420px]">
              {heroImages[0] && (
                <div className="absolute top-0 left-0 w-[55%] h-[60%] bg-[#1A1A1A] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImages[0].url}
                    alt={heroImages[0].name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {heroImages[1] && (
                <div className="absolute top-[15%] right-0 w-[45%] h-[55%] bg-[#1A1A1A] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImages[1].url}
                    alt={heroImages[1].name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {heroImages[2] && (
                <div className="absolute bottom-0 left-[20%] w-[50%] h-[45%] bg-[#1A1A1A] overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImages[2].url}
                    alt={heroImages[2].name}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              {/* Subtle gold accent */}
              <div className="absolute top-[65%] right-[10%] w-8 h-px bg-[#C9A96E]/40" />
            </div>
          </div>
        </div>
      </section>

      {/* ═══ Products grid ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-baseline justify-between mb-10">
            <h2 className="text-[10px] uppercase tracking-[0.25em] text-[#6B6B6B]">
              {products.length}{" "}
              {products.length === 1 ? "fragancia" : "fragancias"} de{" "}
              <span className="text-[#0D0D0D]">{brandName}</span>
            </h2>
            <Link
              href="/marcas"
              className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] hover:text-[#C9A96E] transition-colors"
            >
              ← Todas las marcas
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {products.map((p, i) => (
              <FadeIn key={p.id} direction="up" delay={(i % 3) * 0.06}>
                <ProductCard product={p} variant="light" />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Sobre la marca (only for top brands) ═══ */}
      {showEditorial && (
        <section className="bg-[#F5F0E8] py-20">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
              Sobre la casa
            </p>
            <h3 className="font-serif text-3xl sm:text-4xl font-light text-[#0D0D0D] mb-6">
              {brandName}
            </h3>
            <p className="font-serif italic text-base text-[#6B6B6B] leading-relaxed">
              {description}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}
