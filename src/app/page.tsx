import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ProductCard } from "@/components/product/ProductCard";
import { FadeIn } from "@/components/ui/FadeIn";
import { AnimatedCounter } from "@/components/ui/AnimatedCounter";
import { EyebrowLetters } from "@/components/ui/EyebrowLetters";
import { OffersCountdown } from "@/components/ui/OffersCountdown";
import { Newsletter } from "@/components/ui/Newsletter";
import { HeroProductTrio } from "@/components/home/HeroProductTrio";
import { GenderCards } from "@/components/home/GenderCards";

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

export default async function HomePage() {
  const [
    heroTrio,
    arabicProducts,
    offerProducts,
    designerProducts,
    maleProduct,
    femaleProduct,
    unisexProduct,
    totalProducts,
    brandsStats,
  ] = await Promise.all([
    // Section 1: Hero trio (3 featured with images, fallback to first 3 with images)
    (async () => {
      const featured = await prisma.product.findMany({
        where: { images: { some: {} }, featured: true },
        include: { images: true },
        take: 3,
        orderBy: { updatedAt: "desc" },
      });
      if (featured.length >= 3) return featured;
      // Fallback: pick 3 products with real images at reasonable price
      const fallback = await prisma.product.findMany({
        where: { images: { some: {} }, price: { gte: 200000, lte: 800000 } },
        include: { images: true },
        take: 3,
        orderBy: { price: "desc" },
      });
      return fallback;
    })(),

    // Section 3: Arabic perfumes
    prisma.product.findMany({
      where: {
        images: { some: {} },
        brand: { in: ARABIC_BRANDS },
      },
      orderBy: { price: "asc" },
      take: 8,
      include: { images: true },
    }),

    // Section 4: Offers
    prisma.product.findMany({
      where: { onSale: true, images: { some: {} } },
      include: { images: true },
      take: 6,
      orderBy: { price: "asc" },
    }),

    // Section 5: Designer / Niche (expensive non-arabic)
    prisma.product.findMany({
      where: {
        images: { some: {} },
        price: { gte: 300000 },
        NOT: { brand: { in: ARABIC_BRANDS } },
      },
      orderBy: { price: "desc" },
      take: 4,
      include: { images: true },
    }),

    // Section 6: Gender cards (1 product per gender)
    prisma.product.findFirst({
      where: { gender: "masculine", images: { some: {} } },
      include: { images: true },
      orderBy: { featured: "desc" },
    }),
    prisma.product.findFirst({
      where: { gender: "feminine", images: { some: {} } },
      include: { images: true },
      orderBy: { featured: "desc" },
    }),
    prisma.product.findFirst({
      where: { gender: "unisex", images: { some: {} } },
      include: { images: true },
      orderBy: { featured: "desc" },
    }),

    // Stats for hero
    prisma.product.count(),

    // Top 12 brands by product count
    prisma.product.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 12,
    }),
  ]);

  const totalBrands = await prisma.product
    .groupBy({ by: ["brand"] })
    .then((r) => r.length);

  const fmt = (n: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(n);

  const lowestArabicPrice = arabicProducts[0]?.price ?? 135000;

  return (
    <div>
      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 1 — HERO (oscuro) */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-[#0D0D0D] min-h-screen relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-20 lg:pt-24 lg:pb-32 min-h-screen flex items-center">
          <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-12 lg:gap-16 items-center w-full">
            {/* Left — editorial text */}
            <div>
              <EyebrowLetters
                text="Nueva colección · 2026"
                className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-8"
              />
              <FadeIn direction="up" duration={0.7} delay={0.1}>
                <h1 className="font-serif text-5xl sm:text-6xl lg:text-[68px] font-light text-white leading-[1.02] mb-6">
                  El aroma que te
                  <br />
                  <span className="italic text-[#C9A96E]">define.</span>
                </h1>
              </FadeIn>
              <FadeIn direction="up" duration={0.6} delay={0.25}>
                <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8 max-w-md">
                  Fragancias originales de nicho. Más de 450 perfumes internacionales con envío a todo Colombia.
                </p>
              </FadeIn>
              <FadeIn direction="up" duration={0.6} delay={0.35}>
                <div className="flex items-center gap-2 flex-wrap text-xs text-[#6B6B6B] mb-10">
                  <AnimatedCounter to={totalProducts} duration={2000} pad={0} className="text-white font-serif text-lg" />
                  <span>fragancias</span>
                  <span className="text-[#C9A96E]/40 mx-1">·</span>
                  <AnimatedCounter to={totalBrands} duration={2000} pad={0} className="text-white font-serif text-lg" />
                  <span>marcas</span>
                  <span className="text-[#C9A96E]/40 mx-1">·</span>
                  <span className="text-[#C9A96E]">Envío gratis</span>
                </div>
              </FadeIn>
              <FadeIn direction="up" duration={0.6} delay={0.45}>
                <div className="flex gap-4 flex-wrap">
                  <Link
                    href="/catalogo"
                    className="btn-primary inline-block bg-[#C9A96E] text-[#0D0D0D] px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:bg-[#b8954f]"
                  >
                    Explorar catálogo
                  </Link>
                  <Link
                    href="/quiz"
                    className="btn-primary inline-block border border-white/50 text-white px-8 py-3.5 text-[10px] uppercase tracking-[0.2em] font-normal hover:border-white hover:bg-white/5"
                  >
                    Descubrir mi fragancia →
                  </Link>
                </div>
              </FadeIn>
            </div>

            {/* Right — product trio */}
            <FadeIn direction="right" duration={0.8} distance={40} delay={0.3}>
              <HeroProductTrio products={heroTrio} />
            </FadeIn>
          </div>
        </div>

        {/* Divider */}
        <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#C9A96E]/10 to-transparent" />
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 2 — TICKER */}
      {/* ═══════════════════════════════════════════ */}
      <section
        className="bg-[#0D0D0D] py-4 overflow-hidden"
        style={{
          borderTop: "0.5px solid rgba(201,169,110,0.1)",
          borderBottom: "0.5px solid rgba(201,169,110,0.1)",
        }}
      >
        <div className="flex animate-marquee whitespace-nowrap">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 mr-8">
              {[
                "Envío a todo Colombia",
                "+450 fragancias",
                "Originales garantizados",
                "Pago seguro Wompi",
                "Árabes",
                "Diseñador",
                "Nicho",
              ].map((t) => (
                <span key={t} className="flex items-center gap-8">
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#6B6B6B]">{t}</span>
                  <span className="text-[#C9A96E]/30">·</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 3 — ÁRABES (fondo crema) */}
      {/* ═══════════════════════════════════════════ */}
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
                href={`/catalogo?marca=${ARABIC_BRANDS.map(encodeURIComponent).join("&marca=")}`}
                className="text-[10px] uppercase tracking-[0.25em] text-[#0D0D0D] border-b border-[#0D0D0D] pb-1 hover:text-[#C9A96E] hover:border-[#C9A96E] transition-colors"
              >
                Ver todos los árabes →
              </Link>
            </FadeIn>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 4 — OFERTAS (oscuro) */}
      {/* ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 5 — DISEÑADOR Y NICHO (blanco) */}
      {/* ═══════════════════════════════════════════ */}
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

            {/* Asymmetric editorial layout */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 6 — POR GÉNERO (crema) */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-[#F5F0E8] py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-14">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
              Explora por género
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D] leading-tight">
              Encuentra tu aroma
            </h2>
          </FadeIn>

          <FadeIn direction="up" delay={0.1}>
            <GenderCards
              maleProduct={maleProduct}
              femaleProduct={femaleProduct}
              unisexProduct={unisexProduct}
            />
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 7 — EDITORIAL 01/02 (oscuro) */}
      {/* ═══════════════════════════════════════════ */}
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

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 8 — MARCAS TOP (blanco) */}
      {/* ═══════════════════════════════════════════ */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
              Nuestras casas
            </p>
            <h2 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D]">
              Marcas destacadas
            </h2>
          </FadeIn>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {brandsStats.map((b, i) => (
              <FadeIn key={b.brand} direction="up" delay={(i % 4) * 0.06}>
                <Link
                  href={`/catalogo?marca=${encodeURIComponent(b.brand)}`}
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

      {/* ═══════════════════════════════════════════ */}
      {/* SECCIÓN 9 — NEWSLETTER (oscuro) */}
      {/* ═══════════════════════════════════════════ */}
      <Newsletter />
    </div>
  );
}
