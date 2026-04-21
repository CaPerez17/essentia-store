import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";
import { generateDescription } from "@/lib/scent-notes";
import { FadeIn } from "@/components/ui/FadeIn";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface FeaturedSplitProps {
  product: ProductWithImages | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Split-screen "Esencia de la semana" section.
 * Left: fullbleed product image with "MÁS POPULAR" badge (60%).
 * Right: cream-bg editorial copy + price + CTA (40%).
 */
export function FeaturedSplit({ product }: FeaturedSplitProps) {
  if (!product) return null;

  // Prefer the last image (highest position = lifestyle); fallback to first
  const imgs = product.images ?? [];
  const imgKey =
    imgs.length > 1 ? imgs[imgs.length - 1]?.key : imgs[0]?.key;
  const imageUrl = imgKey ? resolveImageUrl(imgKey) : null;

  const description =
    product.description ||
    generateDescription(product.brand, product.name, product.family, product.gender);

  return (
    <section aria-label="Esencia de la semana">
      <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] min-h-[500px]">
        {/* Left — product image */}
        <FadeIn direction="left" duration={0.7} distance={40}>
          <Link
            href={`/p/${product.slug}`}
            className="group relative block h-[400px] lg:h-[560px] overflow-hidden bg-[#1A1A1A]"
          >
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-[#C9A96E]/40 text-sm uppercase tracking-widest">
                {product.brand}
              </div>
            )}

            {/* Subtle gradient for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(to top, rgba(13,13,13,0.45) 0%, transparent 45%)",
              }}
            />

            {/* "MÁS POPULAR" badge top-left */}
            <span className="absolute top-5 left-5 inline-flex items-center gap-2 bg-[#C9A96E] text-[#0D0D0D] text-[9px] uppercase tracking-[0.3em] px-3 py-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full bg-[#0D0D0D]"
                style={{ animation: "pulse 2s ease-in-out infinite" }}
              />
              Más popular
            </span>
          </Link>
        </FadeIn>

        {/* Right — editorial copy */}
        <FadeIn direction="up" duration={0.6} delay={0.2}>
          <div className="bg-[#F5F0E8] h-full flex items-center p-8 sm:p-12 lg:p-16">
            <div className="w-full">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-5">
                Esencia de la semana
              </p>

              <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-2">
                {product.brand}
              </p>

              <h2
                className="font-serif text-[40px] sm:text-5xl font-light text-[#0D0D0D] leading-[1.05] mb-6"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {product.name}
              </h2>

              <p className="font-serif italic text-base text-[#6B6B6B] leading-relaxed mb-8 max-w-md">
                {description}
              </p>

              <div className="flex items-baseline gap-3 mb-8">
                <span className="font-serif text-3xl text-[#0D0D0D]">
                  {fmt(product.price)}
                </span>
                {product.compareAt != null && product.compareAt > product.price && (
                  <span className="text-sm text-[#6B6B6B] line-through">
                    {fmt(product.compareAt)}
                  </span>
                )}
              </div>

              <Link
                href={`/p/${product.slug}`}
                className="btn-primary inline-flex items-center justify-center w-full sm:w-auto bg-[#0D0D0D] text-white px-10 py-4 text-[10px] uppercase tracking-[0.25em] font-normal hover:bg-[#C9A96E] hover:text-[#0D0D0D] transition-colors"
              >
                Ver producto <span className="ml-2 arrow-nudge">→</span>
              </Link>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
