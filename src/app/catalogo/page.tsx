import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";
import { prisma } from "@/lib/prisma";

function notNull<T>(x: T | null): x is T {
  return x != null;
}

export default async function CatalogPage() {
  // Brand counts (fast groupBy) + filter option lists
  const [brandGroups, products, totalProducts] = await Promise.all([
    prisma.product.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
    }),
    prisma.product.findMany({
      select: {
        family: true,
        occasion: true,
        intensity: true,
        gender: true,
        price: true,
      },
    }),
    prisma.product.count(),
  ]);

  const brands = brandGroups.map((b) => ({
    brand: b.brand,
    count: b._count.brand,
  }));

  const families = Array.from(
    new Set(products.map((p) => p.family).filter(notNull)),
  ).sort();
  const occasions = Array.from(
    new Set(products.map((p) => p.occasion).filter(notNull)),
  ).sort();
  const intensities = Array.from(
    new Set(products.map((p) => p.intensity).filter(notNull)),
  ).sort();
  const genders = Array.from(
    new Set(products.map((p) => p.gender).filter(notNull)),
  ).sort();

  const prices = products.map((p) => p.price);
  const priceRange = {
    min: Math.floor(Math.min(...prices, 0)),
    max: Math.ceil(Math.max(...prices, 0)),
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="mx-auto max-w-7xl px-4 pt-12 pb-20 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <h1 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D] mb-2">
            Catálogo completo
          </h1>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">
            {totalProducts} fragancias disponibles · Envío gratis Colombia
          </p>
        </div>

        <Suspense
          fallback={
            <div className="py-24 text-center">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">
                Cargando catálogo...
              </p>
            </div>
          }
        >
          <CatalogClient
            totalProducts={totalProducts}
            filterOptions={{
              brands,
              families,
              occasions,
              intensities,
              genders,
              priceRange,
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
