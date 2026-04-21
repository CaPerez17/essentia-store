"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductCard } from "@/components/product/ProductCard";
import { resolveImageUrl } from "@/lib/image-url";
import { FadeIn } from "@/components/ui/FadeIn";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface NovedadesClientProps {
  products: ProductWithImages[];
  activeTab: string;
}

const TABS = [
  { key: "todo", label: "Todo" },
  { key: "masculine", label: "Para él" },
  { key: "feminine", label: "Para ella" },
  { key: "unisex", label: "Unisex" },
  { key: "arabes", label: "Árabes" },
  { key: "disenador", label: "Diseñador" },
  { key: "oferta", label: "En oferta" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

function shortDescription(brand: string, name: string): string {
  return `${brand} — ${name}. Fragancia original importada.`;
}

export function NovedadesClient({ products, activeTab }: NovedadesClientProps) {
  const router = useRouter();

  const handleTab = (tab: string) => {
    if (tab === "todo") router.push("/novedades", { scroll: false });
    else router.push(`/novedades?tab=${tab}`, { scroll: false });
  };

  const hero = products[0];
  const rest = products.slice(1);
  const heroImg = hero?.images?.[0]?.key ? resolveImageUrl(hero.images[0].key) : null;

  return (
    <>
      {/* ═══ Tabs (sticky-ish below header) ═══ */}
      <div className="bg-white border-b border-[#E5E5E5]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
            {TABS.map((t) => {
              const active = t.key === activeTab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => handleTab(t.key)}
                  className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors duration-200 border-b-2 ${
                    active
                      ? "text-[#0D0D0D] border-[#C9A96E]"
                      : "text-[#6B6B6B] border-transparent hover:text-[#0D0D0D]"
                  }`}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ═══ Grid editorial ═══ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {products.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-2xl text-[#0D0D0D] mb-2">Sin novedades en esta categoría</p>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                Prueba con otra selección
              </p>
            </div>
          ) : (
            <>
              {/* HERO: first product full-width editorial */}
              {hero && (
                <FadeIn direction="up" className="mb-12">
                  <Link
                    href={`/p/${hero.slug}`}
                    className="pcard group relative grid grid-cols-1 lg:grid-cols-2 gap-0 bg-[#F5F0E8] overflow-hidden"
                  >
                    <div className="relative aspect-[4/5] lg:aspect-auto lg:min-h-[540px] bg-[#F5F0E8] overflow-hidden">
                      {heroImg ? (
                        <img
                          src={heroImg}
                          alt={hero.name}
                          className="pcard-img h-full w-full object-cover"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
                          {hero.brand}
                        </div>
                      )}
                      <span className="absolute top-4 left-4 text-[9px] uppercase tracking-[0.25em] text-[#0D0D0D] bg-[#C9A96E] px-3 py-1.5">
                        Nuevo
                      </span>
                    </div>

                    <div className="p-8 lg:p-14 flex flex-col justify-center">
                      <p className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E] mb-3">
                        {hero.brand}
                      </p>
                      <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light text-[#0D0D0D] leading-[1.05] mb-5 group-hover:text-[#C9A96E] transition-colors">
                        {hero.name}
                      </h2>
                      <p className="text-sm text-[#6B6B6B] leading-relaxed mb-8 max-w-md">
                        {hero.description || shortDescription(hero.brand, hero.name)}
                      </p>
                      <div className="flex items-center gap-4 mb-8">
                        <span className="font-serif text-2xl text-[#0D0D0D]">
                          {fmt(hero.price)}
                        </span>
                        {hero.compareAt != null && hero.compareAt > hero.price && (
                          <span className="text-sm text-[#6B6B6B] line-through">
                            {fmt(hero.compareAt)}
                          </span>
                        )}
                      </div>
                      <span className="self-start btn-primary inline-block bg-[#0D0D0D] text-white px-8 py-3 text-[10px] uppercase tracking-[0.2em] font-normal group-hover:bg-[#C9A96E] group-hover:text-[#0D0D0D] transition-colors">
                        Ver fragancia →
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              )}

              {/* GRID: rest */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {rest.map((p, i) => (
                  <FadeIn key={p.id} direction="up" delay={(i % 3) * 0.08}>
                    <ProductCard product={p} variant="light" badge="NUEVO" />
                  </FadeIn>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
