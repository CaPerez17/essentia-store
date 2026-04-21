import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { OffersCountdown } from "@/components/ui/OffersCountdown";
import { Newsletter } from "@/components/ui/Newsletter";
import { HeroSlider, type HeroSlide } from "@/components/home/HeroSlider";
import { BrandsMarquee } from "@/components/home/BrandsMarquee";
import { AdvisorShowroom } from "@/components/home/AdvisorShowroom";
import { CategoriesGrid } from "@/components/home/CategoriesGrid";
import { DupesGuideBanner } from "@/components/home/DupesGuideBanner";
import { AnimatedBanners } from "@/components/home/AnimatedBanners";
import { FeaturedSplit } from "@/components/home/FeaturedSplit";
import { resolveImageUrl, getBrandLifestyleImage } from "@/lib/image-url";

const ARABIC_BRANDS = [
  "Afnan",
  "Armaf",
  "Lattafa",
  "Al-Haramain",
  "Arabiyat",
  "Rasasi",
  "Swiss Arabian",
  "Ahli",
  "Al-Jazeera",
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function HomePage() {
  const [
    heroArabCheap,
    heroOffer,
    heroNicho,
    arabicProducts,
    offerProducts,
    designerProducts,
    maleProduct,
    femaleProduct,
    unisexProduct,
    brandsStats,
    topBrandsMarquee,
    menBannerProducts,
    womenBannerProducts,
    featuredSplitProduct,
  ] = await Promise.all([
    // Hero slide 1: arabic cheap
    prisma.product.findFirst({
      where: {
        images: { some: {} },
        brand: { in: ARABIC_BRANDS },
        price: { lt: 300000 },
      },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { price: "asc" },
    }),
    // Hero slide 2: onSale
    prisma.product.findFirst({
      where: { onSale: true, images: { some: {} } },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { price: "asc" },
    }),
    // Hero slide 3: niche expensive
    prisma.product.findFirst({
      where: {
        images: { some: {} },
        price: { gte: 800000 },
        NOT: { brand: { in: ARABIC_BRANDS } },
      },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { price: "desc" },
    }),

    // Árabes section
    prisma.product.findMany({
      where: {
        images: { some: {} },
        brand: { in: ARABIC_BRANDS },
      },
      orderBy: { price: "asc" },
      take: 8,
      include: { images: { orderBy: { position: "asc" } } },
    }),

    // Offers section
    prisma.product.findMany({
      where: { onSale: true, images: { some: {} } },
      include: { images: { orderBy: { position: "asc" } } },
      take: 6,
      orderBy: { price: "asc" },
    }),

    // Designer / Niche
    prisma.product.findMany({
      where: {
        images: { some: {} },
        price: { gte: 300000 },
        NOT: { brand: { in: ARABIC_BRANDS } },
      },
      orderBy: { price: "desc" },
      take: 4,
      include: { images: { orderBy: { position: "asc" } } },
    }),

    // 1 product per gender (for CategoriesGrid too)
    prisma.product.findFirst({
      where: { gender: "masculine", images: { some: {} } },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { featured: "desc" },
    }),
    prisma.product.findFirst({
      where: { gender: "feminine", images: { some: {} } },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { featured: "desc" },
    }),
    prisma.product.findFirst({
      where: { gender: "unisex", images: { some: {} } },
      include: { images: { orderBy: { position: "asc" } } },
      orderBy: { featured: "desc" },
    }),

    // Brands stats (for section 8)
    prisma.product.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 12,
    }),

    // Top 10 brand names for marquee
    prisma.product.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 10,
    }),

    // Men banner — 3 expensive products with images
    prisma.product.findMany({
      where: { gender: "masculine", images: { some: {} } },
      orderBy: { price: "desc" },
      take: 3,
      include: { images: { orderBy: { position: "asc" } } },
    }),

    // Women banner — 3 expensive products with images
    prisma.product.findMany({
      where: { gender: "feminine", images: { some: {} } },
      orderBy: { price: "desc" },
      take: 3,
      include: { images: { orderBy: { position: "asc" } } },
    }),

    // Featured split "Esencia de la semana" — featured product with images,
    // fallback to most expensive with images
    (async () => {
      const feat = await prisma.product.findFirst({
        where: { featured: true, images: { some: {} } },
        include: { images: { orderBy: { position: "asc" } } },
        orderBy: { price: "desc" },
      });
      if (feat) return feat;
      return prisma.product.findFirst({
        where: { images: { some: {} } },
        include: { images: { orderBy: { position: "asc" } } },
        orderBy: { price: "desc" },
      });
    })(),
  ]);

  // Build hero slides from fetched products
  const slides: HeroSlide[] = [];

  // Slide 0: promo banner (always first, lifestyle image fullbleed)
  const promoLifestyle = getBrandLifestyleImage("Armaf", 1);
  const promoImageSource = heroOffer ?? heroArabCheap ?? heroNicho;
  const promoImgKey =
    promoImageSource?.images && promoImageSource.images.length > 0
      ? promoImageSource.images[promoImageSource.images.length - 1]?.key
      : null;
  slides.push({
    kind: "promo",
    promoBadge: "Oferta especial",
    eyebrow: "Descuentos escalonados",
    title: "Compra más.",
    titleItalic: "Paga menos.",
    subtitle: "",
    ctaText: "Ver ofertas →",
    ctaHref: "/catalogo?oferta=true",
    secondaryCtaText: "Código ESSENTIA10",
    secondaryCtaHref: "/catalogo",
    imageUrl: promoLifestyle ?? (promoImgKey ? resolveImageUrl(promoImgKey) : null),
    brand: "Essentia",
    productName: "Ofertas de la semana",
    bg: "#0D0D0D",
    promoTiers: [
      { color: "#C9A96E", label: "2+", offer: "5% OFF" },
      { color: "#D97706", label: "3+", offer: "10% OFF" },
      { color: "#DC2626", label: "5+", offer: "15% OFF" },
    ],
  });

  if (heroArabCheap) {
    // Use last image (highest position, most likely lifestyle)
    const imgs = heroArabCheap.images ?? [];
    const imgKey = imgs.length > 0 ? imgs[imgs.length - 1]?.key : null;
    slides.push({
      eyebrow: "Perfumería árabe · Los más vendidos",
      title: "Intensidad",
      titleItalic: "al alcance",
      subtitle: "Fragancias árabes reconocidas mundialmente, ahora con envío a todo Colombia.",
      priceLabel: `Desde ${fmt(heroArabCheap.price)}`,
      ctaText: "Ver árabes",
      ctaHref: "/marcas?cat=arabe",
      secondaryCtaText: "Catálogo completo",
      secondaryCtaHref: "/catalogo",
      imageUrl: imgKey ? resolveImageUrl(imgKey) : null,
      backgroundTextureUrl: getBrandLifestyleImage(heroArabCheap.brand, 0),
      brand: heroArabCheap.brand,
      productName: heroArabCheap.name,
      bg: "#251508",
    });
  }
  if (heroOffer) {
    const imgs = heroOffer.images ?? [];
    const imgKey = imgs.length > 0 ? imgs[imgs.length - 1]?.key : null;
    slides.push({
      eyebrow: "Ofertas de la semana · Solo 72 horas",
      title: "10% menos.",
      titleItalic: "100% original.",
      subtitle: "Selección limitada de fragancias con descuento exclusivo. Aprovecha antes de que se acaben.",
      priceLabel: heroOffer.compareAt
        ? `Antes ${fmt(heroOffer.compareAt)} · Ahora ${fmt(heroOffer.price)}`
        : undefined,
      ctaText: "Ver ofertas →",
      ctaHref: "/catalogo?oferta=true",
      secondaryCtaText: "Código: ESSENTIA10",
      secondaryCtaHref: "/catalogo",
      imageUrl: imgKey ? resolveImageUrl(imgKey) : null,
      backgroundTextureUrl: getBrandLifestyleImage(heroOffer.brand, 0),
      brand: heroOffer.brand,
      productName: heroOffer.name,
      bg: "#1a0a0a",
    });
  }
  if (heroNicho) {
    const imgs = heroNicho.images ?? [];
    const imgKey = imgs.length > 0 ? imgs[imgs.length - 1]?.key : null;
    slides.push({
      eyebrow: "Perfumería de nicho · Colección exclusiva",
      title: "Fragancias que",
      titleItalic: "te definen.",
      subtitle: "Xerjoff, Creed, Le Labo, Bond No.9 y más. Lo más exclusivo del mundo, en Colombia.",
      priceLabel: "Perfumería de autor",
      ctaText: "Explorar nicho",
      ctaHref: "/marcas",
      secondaryCtaText: "Quiz olfativo →",
      secondaryCtaHref: "/quiz",
      imageUrl: imgKey ? resolveImageUrl(imgKey) : null,
      backgroundTextureUrl: getBrandLifestyleImage(heroNicho.brand, 0),
      brand: heroNicho.brand,
      productName: heroNicho.name,
      bg: "#0D0D0D",
    });
  }

  // Fallback if no slides could be built
  if (slides.length === 0) {
    slides.push({
      eyebrow: "Essentia · Nueva colección 2026",
      title: "El aroma que te",
      titleItalic: "define.",
      subtitle: "Fragancias originales de nicho. +450 perfumes con envío a todo Colombia.",
      ctaText: "Explorar catálogo",
      ctaHref: "/catalogo",
      secondaryCtaText: "Descubrir mi fragancia →",
      secondaryCtaHref: "/quiz",
      imageUrl: null,
      brand: "Essentia",
      productName: "Colección completa",
      bg: "#0D0D0D",
    });
  }

  const totalBrands = await prisma.product
    .groupBy({ by: ["brand"] })
    .then((r) => r.length);

  const topBrandNames = topBrandsMarquee.map((b) => b.brand);
  const lowestArabicPrice = arabicProducts[0]?.price ?? 135000;

  return (
    <div>
      {/* ═══ 1. HERO SLIDER ═══ */}
      <HeroSlider slides={slides} intervalMs={4000} />

      {/* ═══ 2. BRANDS MARQUEE ═══ */}
      <BrandsMarquee brands={topBrandNames} />

      {/* ═══ 3. ADVISOR SHOWROOM — virtual boutique entry ═══ */}
      <AdvisorShowroom />

      {/* ═══ 4. ÁRABES ═══ */}
      {arabicProducts.length > 0 && (
        <section className="bg-[#F5F0E8] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" className="max-w-3xl mb-14">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
                Perfumería árabe · Los más vendidos en Colombia
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#0D0D0D] leading-tight mb-4">
                Fragancias que conquistan
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-xl mb-5">
                Las joyas del Medio Oriente. Reconocidas mundialmente, accesibles en Colombia.
              </p>
              <span className="inline-block text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] border border-[#C9A96E]/40 px-3 py-1.5">
                Desde {fmt(lowestArabicPrice)}
              </span>
            </FadeIn>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {arabicProducts.map((p, i) => (
                <FadeIn key={p.id} direction="up" delay={(i % 4) * 0.08}>
                  <ProductCard
                    product={p}
                    variant="light"
                    badge={p.onSale ? "OFERTA -10%" : "ÁRABE"}
                  />
                </FadeIn>
              ))}
            </div>

            <FadeIn direction="up" className="mt-10 text-center">
              <Link
                href="/marcas?cat=arabe"
                className="text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                Ver todos los árabes →
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══ 4.5 ANIMATED BANNERS (Para él / Para ella) ═══ */}
      <AnimatedBanners
        menProducts={menBannerProducts}
        womenProducts={womenBannerProducts}
      />

      {/* ═══ 5. OFERTAS ═══ */}
      {offerProducts.length > 0 && (
        <section className="bg-[#0D0D0D] py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" className="text-center mb-14">
              <p className="text-[10px] uppercase tracking-[0.3em] text-red-400 mb-4">
                Solo por tiempo limitado
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-white leading-tight mb-6">
                Ofertas de la semana
              </h2>
              <OffersCountdown />
            </FadeIn>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {offerProducts.map((p, i) => (
                <FadeIn key={p.id} direction="up" delay={(i % 3) * 0.1}>
                  <ProductCard product={p} variant="dark" badge="-10%" />
                </FadeIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ 5.5 FEATURED SPLIT (Esencia de la semana) ═══ */}
      <FeaturedSplit product={featuredSplitProduct} />

      {/* ═══ 6. DISEÑADOR / NICHO ═══ */}
      {designerProducts.length >= 4 && (
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <FadeIn direction="up" className="max-w-3xl mb-14">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
                Perfumería de diseñador · Nicho exótico
              </p>
              <h2 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-light text-[#0D0D0D] leading-tight mb-4">
                Para quienes saben lo que buscan
              </h2>
              <p className="text-sm text-[#6B6B6B] leading-relaxed max-w-xl">
                Las casas perfumeras más exclusivas con mercado en Colombia.
              </p>
            </FadeIn>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <FadeIn direction="up" className="lg:col-span-2 lg:row-span-1">
                <div className="h-full">
                  <ProductCard product={designerProducts[0]!} variant="editorial" />
                </div>
              </FadeIn>
              <div className="grid grid-cols-1 gap-4">
                {designerProducts.slice(1, 4).map((p, i) => (
                  <FadeIn key={p.id} direction="up" delay={(i + 1) * 0.08}>
                    <ProductCard product={p} variant="editorial" />
                  </FadeIn>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══ 6. DUPES GUIDE BANNER ═══ */}
      <DupesGuideBanner />

      {/* ═══ 7. CATEGORIES (Árabes / Nicho / Diseñador) ═══ */}
      <CategoriesGrid
        arabProduct={maleProduct}
        nichoProduct={unisexProduct}
        disenadorProduct={femaleProduct}
      />

      {/* ═══ 8. EDITORIAL 01/02 ═══ */}
      <section className="bg-[#0D0D0D] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 lg:gap-24">
            <FadeIn direction="up" className="flex items-start gap-8">
              <AnimatedCounter
                to={1}
                className="font-serif text-7xl lg:text-8xl text-[#C9A96E]/10 leading-none select-none shrink-0"
              />
              <div className="pt-2">
                <h3 className="font-serif text-2xl text-white mb-4">Curación artesanal</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                  Cada fragancia es seleccionada por su singularidad, calidad de ingredientes y capacidad de contar una historia. No vendemos todo — vendemos lo que amamos.
                </p>
              </div>
            </FadeIn>
            <FadeIn direction="up" delay={0.15} className="flex items-start gap-8">
              <AnimatedCounter
                to={2}
                duration={1100}
                className="font-serif text-7xl lg:text-8xl text-[#C9A96E]/10 leading-none select-none shrink-0"
              />
              <div className="pt-2">
                <h3 className="font-serif text-2xl text-white mb-4">Originales garantizados</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">
                  Trabajamos directamente con distribuidores autorizados. Cada frasco viene con certificado de autenticidad y garantía de procedencia.
                </p>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══ 9. MARCAS TOP ═══ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
              Nuestras casas · {totalBrands} marcas
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D] mb-3">
              Marcas destacadas
            </h2>
            <Link
              href="/marcas"
              className="inline-block mt-4 text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] hover:text-[#0D0D0D] border-b border-[#C9A96E] pb-1 transition-colors"
            >
              Ver todas las marcas →
            </Link>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {brandsStats.map((b, i) => (
              <FadeIn key={b.brand} direction="up" delay={(i % 4) * 0.06}>
                <Link
                  href={`/marcas/${b.brand
                    .toLowerCase()
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "")}`}
                  className="flex items-center justify-between bg-[#F5F0E8] border border-[#C9A96E]/30 hover:border-[#C9A96E] hover:bg-[#C9A96E]/5 px-5 py-4 transition-all duration-300 group"
                >
                  <span className="text-sm text-[#0D0D0D] font-medium group-hover:text-[#C9A96E] transition-colors">
                    {b.brand}
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.15em] text-[#C9A96E]">
                    {b._count.brand}
                  </span>
                </Link>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ 10. NEWSLETTER ═══ */}
      <Newsletter />
    </div>
  );
}
