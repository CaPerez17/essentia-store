import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  name: { name: "asc" },
  "brand-asc": { brand: "asc" },
};

/**
 * Map a "family" filter value to a Prisma OR clause that matches either the
 * `family` column (typed values from seed) OR a `tags` substring (PDF products
 * don't have `family` populated, but some tags contain family-like keywords).
 */
function familyOrClause(fam: string): Prisma.ProductWhereInput[] {
  const lower = fam.toLowerCase().trim();
  return [
    { family: { equals: lower, mode: "insensitive" } },
    { tags: { contains: lower, mode: "insensitive" } },
  ];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const brands = searchParams.getAll("marca");
    const families = searchParams.getAll("familia");
    const occasions = searchParams.getAll("ocasion");
    const intensities = searchParams.getAll("intensidad");
    const gender = searchParams.get("genero");
    const priceMin = searchParams.get("precioMin");
    const priceMax = searchParams.get("precioMax");
    const q = (searchParams.get("q") || "").trim();
    const oferta = searchParams.get("oferta") === "true";
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    const AND: Prisma.ProductWhereInput[] = [];

    if (brands.length > 0) AND.push({ brand: { in: brands } });
    if (occasions.length > 0) AND.push({ occasion: { in: occasions } });
    if (intensities.length > 0) AND.push({ intensity: { in: intensities } });
    if (gender) AND.push({ gender });
    if (oferta) AND.push({ onSale: true });

    // Family: each selected family must match (family column OR tags substring).
    for (const fam of families) {
      AND.push({ OR: familyOrClause(fam) });
    }

    // Free-text search across name, brand, tags
    if (q.length >= 2) {
      AND.push({
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
          { tags: { contains: q, mode: "insensitive" } },
        ],
      });
    }

    const minVal = priceMin ? parseFloat(priceMin) : NaN;
    const maxVal = priceMax ? parseFloat(priceMax) : NaN;
    if (!Number.isNaN(minVal) || !Number.isNaN(maxVal)) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (!Number.isNaN(minVal)) priceFilter.gte = minVal;
      if (!Number.isNaN(maxVal)) priceFilter.lte = maxVal;
      AND.push({ price: priceFilter });
    }

    const where: Prisma.ProductWhereInput = AND.length > 0 ? { AND } : {};
    const orderBy = SORT_MAP[sort] ?? SORT_MAP.newest;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: { images: { orderBy: { position: "asc" } } },
      }),
      prisma.product.count({ where }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return NextResponse.json({
      items,
      total,
      page,
      pageCount,
    });
  } catch (err) {
    console.error("[api/products]", err);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
