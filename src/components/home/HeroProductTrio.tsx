import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface HeroProductTrioProps {
  products: ProductWithImages[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function HeroProductTrio({ products }: HeroProductTrioProps) {
  if (products.length < 3) return null;
  const [left, center, right] = products;

  const imgUrl = (p: ProductWithImages) => {
    const key = p.images?.[0]?.key;
    return key ? resolveImageUrl(key) : null;
  };

  const Card = ({
    p,
    size,
    showFeaturedBadge = false,
  }: {
    p: ProductWithImages;
    size: "sm" | "lg";
    showFeaturedBadge?: boolean;
  }) => {
    const url = imgUrl(p);
    const h = size === "lg" ? "h-[320px] md:h-[420px]" : "h-[240px] md:h-[320px]";
    return (
      <Link
        href={`/p/${p.slug}`}
        className={`pcard group relative block ${h} bg-[#1A1A1A] overflow-hidden`}
      >
        {url ? (
          <img
            src={url}
            alt={p.name}
            className="pcard-img h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
            {p.brand}
          </div>
        )}
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/95 via-[#0D0D0D]/20 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-400" />

        {/* Featured badge (center only) */}
        {showFeaturedBadge && (
          <span className="absolute top-3 left-3 text-[8px] uppercase tracking-[0.25em] text-[#0D0D0D] bg-[#C9A96E] px-2.5 py-1">
            Featured
          </span>
        )}

        {/* Content on hover */}
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5 z-10 transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
          <p className="text-[8px] sm:text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
            {p.brand}
          </p>
          <p className="font-serif text-sm sm:text-base text-white leading-tight mb-1.5">
            {p.name}
          </p>
          <div className="flex items-baseline justify-between">
            <p className="text-xs text-white/80">{fmt(p.price)}</p>
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Ver →
            </span>
          </div>
        </div>
      </Link>
    );
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center">
      <div className="pt-10">
        <Card p={left!} size="sm" />
      </div>
      <div>
        <Card p={center!} size="lg" showFeaturedBadge />
      </div>
      <div className="pt-10">
        <Card p={right!} size="sm" />
      </div>
    </div>
  );
}
