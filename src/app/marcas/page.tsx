import { prisma } from "@/lib/prisma";
import { resolveImageUrl } from "@/lib/image-url";
import { categorizeBrand, brandSlug } from "@/lib/brands";
import { BrandsClient, type BrandCard } from "./BrandsClient";

export const metadata = {
  title: "Marcas de Perfumería | Essentia Colombia",
  description:
    "Explora las marcas de perfumería en Essentia. Árabes, nicho y diseñador con envío a todo Colombia.",
};

export default async function BrandsPage() {
  // Aggregate stats per brand
  const stats = await prisma.product.groupBy({
    by: ["brand"],
    _count: { brand: true },
    _min: { price: true },
    _max: { price: true },
    orderBy: { _count: { brand: "desc" } },
  });

  // Fetch hero image per brand: prefer products with MORE images,
  // then take the LAST image (highest position = most likely lifestyle shot).
  const brandNames = stats.map((s) => s.brand);
  const heroProducts = await prisma.product.findMany({
    where: {
      brand: { in: brandNames },
      images: { some: {} },
    },
    select: {
      brand: true,
      images: { select: { key: true, position: true }, orderBy: { position: "desc" } },
    },
  });

  // For each brand, pick the product with the MOST images, then its last image
  const heroByBrand = new Map<string, string>();
  const bestCountByBrand = new Map<string, number>();
  for (const p of heroProducts) {
    const count = p.images.length;
    if (count === 0) continue;
    const currentBest = bestCountByBrand.get(p.brand) ?? 0;
    if (count > currentBest) {
      bestCountByBrand.set(p.brand, count);
      // images are ordered desc, so [0] is the highest position
      heroByBrand.set(p.brand, p.images[0]!.key);
    }
  }

  const brands: BrandCard[] = stats.map((s) => ({
    brand: s.brand,
    slug: brandSlug(s.brand),
    category: categorizeBrand(s.brand),
    count: s._count.brand,
    minPrice: s._min.price ?? 0,
    maxPrice: s._max.price ?? 0,
    heroImage: heroByBrand.has(s.brand)
      ? resolveImageUrl(heroByBrand.get(s.brand)!)
      : null,
  }));

  const totalBrands = brands.length;

  return (
    <div className="bg-white min-h-screen">
      {/* Dark header */}
      <section className="bg-[#0D0D0D] py-20 lg:py-24 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-5">
                Essentia · Catálogo de marcas
              </p>
              <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light leading-[1.02] mb-4">
                <span className="text-[#C9A96E]">{totalBrands} marcas</span>
                <br />
                <span className="text-white italic">internacionales</span>
              </h1>
              <p className="text-sm text-[#6B6B6B] max-w-xl leading-relaxed">
                Árabes, nicho y diseñador. Lo mejor de la perfumería mundial, curado y disponible en Colombia.
              </p>
            </div>
            <div className="font-serif text-[120px] lg:text-[180px] text-[#C9A96E]/8 leading-none select-none tabular-nums">
              {totalBrands}
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + Grid */}
      <BrandsClient brands={brands} />
    </div>
  );
}
