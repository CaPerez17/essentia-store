import { Suspense } from "react";
import { CatalogClient } from "./CatalogClient";
import { prisma } from "@/lib/prisma";

function notNull<T>(x: T | null): x is T {
  return x != null;
}

export default async function CatalogPage() {
  const products = await prisma.product.findMany({
    select: {
      brand: true,
      family: true,
      occasion: true,
      intensity: true,
      gender: true,
      price: true,
    },
  });

  const brands = Array.from(new Set(products.map((p) => p.brand).filter(notNull))).sort();
  const families = Array.from(new Set(products.map((p) => p.family).filter(notNull))).sort();
  const occasions = Array.from(new Set(products.map((p) => p.occasion).filter(notNull))).sort();
  const intensities = Array.from(new Set(products.map((p) => p.intensity).filter(notNull))).sort();
  const genders = Array.from(new Set(products.map((p) => p.gender).filter(notNull))).sort();
  const prices = products.map((p) => p.price);
  const priceRange = {
    min: Math.floor(Math.min(...prices, 0)),
    max: Math.ceil(Math.max(...prices, 0)),
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-medium tracking-tight text-[var(--text)]">
          Catálogo
        </h1>
      </div>
      <Suspense fallback={<div className="py-12 text-center text-[var(--text-muted)]">Cargando catálogo...</div>}>
        <CatalogClient
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
  );
}
