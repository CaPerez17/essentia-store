"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { BrandCategory } from "@/lib/brands";
import { BRAND_CATEGORY_LABELS } from "@/lib/brands";

export interface BrandCard {
  brand: string;
  slug: string;
  category: BrandCategory;
  count: number;
  minPrice: number;
  maxPrice: number;
  heroImage: string | null;
}

interface BrandsClientProps {
  brands: BrandCard[];
}

type Filter = "todas" | "arabe" | "nicho" | "disenador" | "top";

const TABS: { key: Filter; label: string }[] = [
  { key: "todas", label: "Todas" },
  { key: "arabe", label: "Árabes" },
  { key: "nicho", label: "Nicho" },
  { key: "disenador", label: "Diseñador" },
  { key: "top", label: "Más vendidas" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function BrandsClient({ brands }: BrandsClientProps) {
  const [filter, setFilter] = useState<Filter>("todas");

  const filtered = useMemo(() => {
    if (filter === "todas") return brands;
    if (filter === "top") return [...brands].sort((a, b) => b.count - a.count).slice(0, 20);
    return brands.filter((b) => b.category === filter);
  }, [brands, filter]);

  return (
    <>
      {/* Sticky filter tabs (white bg below dark header) */}
      <div
        className="sticky top-0 z-20 bg-white"
        style={{ borderBottom: "1px solid #E5E5E5" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-4">
            {TABS.map((t) => {
              const active = filter === t.key;
              const count = (() => {
                if (t.key === "todas") return brands.length;
                if (t.key === "top") return Math.min(20, brands.length);
                return brands.filter((b) => b.category === t.key).length;
              })();
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setFilter(t.key)}
                  className={`shrink-0 px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] transition-colors duration-200 border-b-2 flex items-center gap-2 ${
                    active
                      ? "text-[#0D0D0D] border-[#C9A96E]"
                      : "text-[#6B6B6B] border-transparent hover:text-[#0D0D0D]"
                  }`}
                >
                  <span>{t.label}</span>
                  <span className="text-[#C9A96E]/60 tabular-nums">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {filtered.length === 0 ? (
            <div className="py-24 text-center">
              <p className="font-serif text-xl text-[#0D0D0D] mb-2">Sin marcas en esta categoría</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-[#F5F0E8]">
              {filtered.map((b) => (
                <BrandCardItem key={b.brand} brand={b} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function BrandCardItem({ brand }: { brand: BrandCard }) {
  const initial = brand.brand.charAt(0).toUpperCase();

  return (
    <Link
      href={`/marcas/${brand.slug}`}
      className="brand-card group relative bg-white flex flex-col transition-[transform,border-color] duration-300 hover:-translate-y-0.5"
      style={{ borderBottom: "2px solid transparent" }}
    >
      {/* Image */}
      <div className="relative aspect-square bg-[#F8F5EF] overflow-hidden flex items-center justify-center">
        {brand.heroImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={brand.heroImage}
            alt={brand.brand}
            className="max-h-full max-w-full object-contain p-6 transition-transform duration-500 group-hover:scale-[1.04]"
            loading="lazy"
          />
        ) : (
          <span className="font-serif text-7xl text-[#C9A96E]">{initial}</span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-3">
          <span className="text-[9px] uppercase tracking-[0.25em] text-white">
            Ver fragancias →
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-serif text-base font-semibold text-[#0D0D0D] truncate group-hover:text-[#C9A96E] transition-colors">
            {brand.brand}
          </h3>
          <span className="text-[9px] uppercase tracking-[0.15em] text-[#C9A96E] shrink-0">
            {brand.count}
          </span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.15em] text-[#6B6B6B]">
          {brand.count} {brand.count === 1 ? "fragancia" : "fragancias"}
        </p>
        <p className="text-[11px] text-[#6B6B6B]">
          Desde {fmt(brand.minPrice)}
        </p>
        <span
          className={`mt-1 self-start text-[8px] uppercase tracking-[0.2em] px-2 py-0.5 ${
            brand.category === "arabe"
              ? "bg-[#251508] text-[#C9A96E]"
              : brand.category === "nicho"
                ? "bg-[#0D0D0D] text-white"
                : "bg-[#F5F0E8] text-[#6B6B6B]"
          }`}
        >
          {BRAND_CATEGORY_LABELS[brand.category]}
        </span>
      </div>

      {/* Gold underline on hover */}
      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-[#C9A96E] scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />
    </Link>
  );
}
