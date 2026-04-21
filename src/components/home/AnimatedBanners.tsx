import Link from "next/link";
import { resolveImageUrl, getBrandLifestyleImage } from "@/lib/image-url";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface AnimatedBannersProps {
  menProducts: ProductWithImages[];
  womenProducts: ProductWithImages[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function AnimatedBanners({ menProducts, womenProducts }: AnimatedBannersProps) {
  if (menProducts.length < 1 && womenProducts.length < 1) return null;

  return (
    <section className="bg-[rgba(201,169,110,0.06)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-px">
        <BannerCard
          products={menProducts}
          label="Para él · Esta semana"
          href="/catalogo?genero=masculine"
          bg="#0D0D0D"
          lifestyleUrl={getBrandLifestyleImage("Armaf", 0)}
        />
        <BannerCard
          products={womenProducts}
          label="Para ella · Esta semana"
          href="/catalogo?genero=feminine"
          bg="#0A0A0A"
          lifestyleUrl={getBrandLifestyleImage("Carolina Herrera", 0)}
        />
      </div>
    </section>
  );
}

function BannerCard({
  products,
  label,
  href,
  bg,
  lifestyleUrl,
}: {
  products: ProductWithImages[];
  label: string;
  href: string;
  bg: string;
  lifestyleUrl?: string | null;
}) {
  if (products.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-[#6B6B6B] text-sm" style={{ backgroundColor: bg }}>
        Próximamente
      </div>
    );
  }

  const [front, left, right] = [products[0], products[1], products[2]];
  const frontImgKey = front?.images?.[0]?.key;
  const leftImgKey = left?.images?.[0]?.key;
  const rightImgKey = right?.images?.[0]?.key;
  const frontImg = frontImgKey ? resolveImageUrl(frontImgKey) : null;
  const leftImg = leftImgKey ? resolveImageUrl(leftImgKey) : null;
  const rightImg = rightImgKey ? resolveImageUrl(rightImgKey) : null;

  return (
    <Link
      href={href}
      className="group relative block h-[280px] md:h-[320px] overflow-hidden transition-colors duration-500"
      style={{ backgroundColor: bg }}
    >
      {/* Lifestyle fullbleed background */}
      {lifestyleUrl && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lifestyleUrl}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: "rgba(13,13,13,0.6)" }}
          />
        </>
      )}

      {/* Three stacked fanning images */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Left back */}
        {leftImg && (
          <div
            className="absolute w-[42%] h-[75%] transition-all duration-500 ease-out
              translate-x-[-25%] translate-y-[5%] -rotate-8 opacity-60 scale-90
              group-hover:translate-x-[-55%] group-hover:-rotate-[15deg] group-hover:opacity-100 group-hover:scale-95"
            style={{ zIndex: 2 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={leftImg}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Right back */}
        {rightImg && (
          <div
            className="absolute w-[42%] h-[75%] transition-all duration-500 ease-out
              translate-x-[25%] translate-y-[5%] rotate-8 opacity-45 scale-[0.85]
              group-hover:translate-x-[55%] group-hover:rotate-[15deg] group-hover:opacity-100 group-hover:scale-95"
            style={{ zIndex: 1 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={rightImg}
              alt=""
              className="w-full h-full object-contain"
            />
          </div>
        )}

        {/* Front — centered and prominent */}
        {frontImg && (
          <div
            className="absolute w-[48%] h-[88%] transition-all duration-500 ease-out
              translate-x-0 translate-y-0 rotate-0 scale-100 opacity-100"
            style={{ zIndex: 3 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={frontImg}
              alt={front?.name}
              className="w-full h-full object-contain"
            />
          </div>
        )}
      </div>

      {/* Gradient from bottom for text readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)",
          zIndex: 4,
        }}
      />

      {/* Text overlay */}
      <div className="absolute inset-x-0 bottom-0 p-6 z-10">
        <p className="text-[9px] uppercase tracking-[0.3em] text-[#C9A96E] mb-2">
          {label}
        </p>
        {front && (
          <p className="font-serif text-base sm:text-lg text-white leading-tight truncate">
            {front.brand} — {front.name}
          </p>
        )}
        <div className="flex items-center justify-between mt-2">
          {front && (
            <span className="text-xs text-white/70">{fmt(front.price)}</span>
          )}
          <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E] inline-flex items-center gap-1.5">
            Ver colección
            <span className="arrow-nudge">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
