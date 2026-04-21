import Link from "next/link";
import { brandSlug } from "@/lib/brands";

interface BrandsMarqueeProps {
  brands: string[];
}

/**
 * Animated infinite marquee of brand names, reuses .animate-marquee CSS class
 * from globals.css (25s smooth).
 */
export function BrandsMarquee({ brands }: BrandsMarqueeProps) {
  if (brands.length === 0) return null;

  // Duplicate for seamless loop
  const loop = [...brands, ...brands];

  return (
    <section
      className="bg-[#0D0D0D] py-5 overflow-hidden"
      style={{
        borderTop: "0.5px solid rgba(201,169,110,0.1)",
        borderBottom: "0.5px solid rgba(201,169,110,0.1)",
      }}
      aria-label="Marcas destacadas"
    >
      <div className="flex animate-marquee whitespace-nowrap">
        {loop.map((brand, i) => (
          <Link
            key={`${brand}-${i}`}
            href={`/marcas/${brandSlug(brand)}`}
            className="group flex items-center gap-8 mr-8 shrink-0"
          >
            <span className="font-serif text-xl sm:text-2xl text-[#6B6B6B] group-hover:text-[#C9A96E] transition-colors duration-300 whitespace-nowrap">
              {brand}
            </span>
            <span className="text-[#C9A96E]/30 text-sm" aria-hidden>
              ◆
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
