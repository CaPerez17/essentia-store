import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface CategoriesGridProps {
  arabProduct: ProductWithImages | null;
  nichoProduct: ProductWithImages | null;
  disenadorProduct: ProductWithImages | null;
}

/**
 * 3 full-bleed category cards with real product image as background.
 * Replaces the old "género" grid in the home page.
 */
export function CategoriesGrid({
  arabProduct,
  nichoProduct,
  disenadorProduct,
}: CategoriesGridProps) {
  const categories = [
    {
      href: "/marcas?cat=arabe",
      hrefAlt: "/catalogo?marca=Afnan&marca=Armaf&marca=Lattafa",
      label: "Árabes",
      tagline: "Intensidad que conquista",
      description: "Afnan · Armaf · Lattafa · Al-Haramain",
      product: arabProduct,
      tintFrom: "#251508",
    },
    {
      href: "/marcas",
      label: "Nicho",
      tagline: "La perfumería artesanal",
      description: "Xerjoff · Creed · Le Labo · Bond No.9",
      product: nichoProduct,
      tintFrom: "#0D0D0D",
    },
    {
      href: "/marcas",
      label: "Diseñador",
      tagline: "Íconos globales",
      description: "Dior · Chanel · YSL · Versace",
      product: disenadorProduct,
      tintFrom: "#1A1515",
    },
  ];

  return (
    <section className="bg-[#0D0D0D] py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-4">
            Explora por categoría
          </p>
          <h2 className="font-serif text-4xl sm:text-5xl font-light text-white">
            Tres mundos. Una misma pasión.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {categories.map((c) => {
            const imgKey = c.product?.images?.[0]?.key;
            const imgUrl = imgKey ? resolveImageUrl(imgKey) : null;

            return (
              <Link
                key={c.label}
                href={c.href}
                className="pcard group relative aspect-[4/5] overflow-hidden"
                style={{ backgroundColor: c.tintFrom }}
              >
                {imgUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgUrl}
                    alt=""
                    className="pcard-img h-full w-full object-cover opacity-40 group-hover:opacity-60 transition-opacity duration-500"
                  />
                )}

                {/* Darkening gradient from bottom */}
                <div
                  className="absolute inset-0 bg-gradient-to-t group-hover:from-[#0D0D0D]/85 transition-all duration-400"
                  style={{
                    backgroundImage: `linear-gradient(to top, ${c.tintFrom}ee 0%, ${c.tintFrom}80 40%, transparent 100%)`,
                  }}
                />

                {/* Content */}
                <div className="absolute inset-x-0 bottom-0 p-8">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] mb-2">
                    {c.tagline}
                  </p>
                  <h3 className="font-serif text-4xl lg:text-5xl font-light text-white leading-none mb-4 group-hover:text-[#C9A96E] transition-colors duration-300">
                    {c.label}
                  </h3>
                  <p className="text-[11px] text-white/70 mb-5">
                    {c.description}
                  </p>
                  <span className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E] inline-flex items-center gap-2">
                    Ver marcas
                    <span className="transition-transform duration-300 group-hover:translate-x-1">
                      →
                    </span>
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
