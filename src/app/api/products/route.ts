import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
import type { Prisma } from "@prisma/client";

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  name: { name: "asc" },
};

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
    const sort = searchParams.get("sort") || "newest";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "12", 10)));

    const where: Prisma.ProductWhereInput = {};

    if (brands.length > 0) {
      where.brand = { in: brands };
    }
    if (families.length > 0) {
      where.family = { in: families };
    }
    if (occasions.length > 0) {
      where.occasion = { in: occasions };
    }
    if (intensities.length > 0) {
      where.intensity = { in: intensities };
    }
    if (gender) {
      where.gender = gender;
    }
    const minVal = priceMin ? parseFloat(priceMin) : NaN;
    const maxVal = priceMax ? parseFloat(priceMax) : NaN;
    if (!Number.isNaN(minVal) || !Number.isNaN(maxVal)) {
      const priceFilter: { gte?: number; lte?: number } = {};
      if (!Number.isNaN(minVal)) priceFilter.gte = minVal;
      if (!Number.isNaN(maxVal)) priceFilter.lte = maxVal;
      where.price = priceFilter;
    }

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
    console.error(err);
    return NextResponse.json(
      { error: "Error al obtener productos" },
      { status: 500 }
    );
  }
}
