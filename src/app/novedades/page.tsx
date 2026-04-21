import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { NovedadesClient } from "./NovedadesClient";
import type { Prisma } from "@prisma/client";

const ARABIC_BRANDS = [
  "Afnan", "Armaf", "Lattafa", "Al-Haramain",
  "Arabiyat", "Rasasi", "Swiss Arabian", "Ahli", "Al-Jazeera",
];

type TabKey = "todo" | "masculine" | "feminine" | "unisex" | "arabes" | "disenador" | "oferta";

function buildWhere(tab: TabKey): Prisma.ProductWhereInput {
  const base: Prisma.ProductWhereInput = { images: { some: {} } };
  switch (tab) {
    case "masculine":
      return { ...base, gender: "masculine" };
    case "feminine":
      return { ...base, gender: "feminine" };
    case "unisex":
      return { ...base, gender: "unisex" };
    case "arabes":
      return { ...base, brand: { in: ARABIC_BRANDS } };
    case "disenador":
      return { ...base, price: { gte: 300000 }, NOT: { brand: { in: ARABIC_BRANDS } } };
    case "oferta":
      return { ...base, onSale: true };
    default:
      return base;
  }
}

export default async function NovedadesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab: tabParam } = await searchParams;
  const tab: TabKey = ((): TabKey => {
    const validTabs: TabKey[] = ["todo", "masculine", "feminine", "unisex", "arabes", "disenador", "oferta"];
    return validTabs.includes(tabParam as TabKey) ? (tabParam as TabKey) : "todo";
  })();

  const where = buildWhere(tab);

  // Prefer isNew=true, complement with latest if not enough
  const [isNewProducts, allProducts, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where: { ...where, isNew: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { images: true },
    }),
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { images: true },
    }),
    prisma.product.count(),
  ]);

  // Use isNew if >= 3, otherwise use latest
  const products = isNewProducts.length >= 3 ? isNewProducts : allProducts;

  return (
    <div>
      {/* ═══ Header oscuro ═══ */}
      <section className="bg-[#0D0D0D] py-16 lg:py-20 relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-end justify-between gap-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-5">
              Essentia · Novedades
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-white leading-[1.02] mb-4">
              Lo que acaba
              <br />
              de llegar
            </h1>
            <p className="text-sm text-[#6B6B6B] max-w-md">
              Las fragancias más nuevas de nuestro catálogo.
            </p>
          </div>
          <div className="font-serif text-7xl lg:text-8xl text-[#C9A96E]/15 leading-none select-none">
            {totalProducts}
          </div>
        </div>
      </section>

      {/* Tabs + Grid (client) */}
      <Suspense
        fallback={
          <div className="py-24 text-center bg-white">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B]">Cargando...</p>
          </div>
        }
      >
        <NovedadesClient products={products} activeTab={tab} />
      </Suspense>
    </div>
  );
}
