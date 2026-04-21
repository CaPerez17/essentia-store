import Link from "next/link";
import { resolveImageUrl } from "@/lib/image-url";
import type { Product, ProductImage } from "@prisma/client";

type ProductWithImages = Product & { images?: ProductImage[] };

interface GenderCardsProps {
  /** one product per gender, used as background image */
  maleProduct: ProductWithImages | null;
  femaleProduct: ProductWithImages | null;
  unisexProduct: ProductWithImages | null;
}

export function GenderCards({ maleProduct, femaleProduct, unisexProduct }: GenderCardsProps) {
  const cards = [
    { label: "Para él", query: "masculine", product: maleProduct },
    { label: "Para ella", query: "feminine", product: femaleProduct },
    { label: "Sin género", query: "unisex", product: unisexProduct },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cards.map((c) => {
        const imgKey = c.product?.images?.[0]?.key;
        const url = imgKey ? resolveImageUrl(imgKey) : null;
        return (
          <Link
            key={c.query}
            href={`/catalogo?genero=${c.query}`}
            className="pcard group relative aspect-[4/5] overflow-hidden bg-[#1A1A1A]"
          >
            {url ? (
              <img src={url} alt={c.label} className="pcard-img h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
                {c.label}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/30 to-transparent group-hover:from-[#0D0D0D]/85 transition-all duration-400" />

            <div className="absolute inset-x-0 bottom-0 p-8 text-center">
              <h3 className="font-serif text-3xl font-light text-white mb-2 group-hover:text-[#C9A96E] transition-colors duration-300">
                {c.label}
              </h3>
              <span className="text-[9px] uppercase tracking-[0.25em] text-[#C9A96E]">
                Ver colección →
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
