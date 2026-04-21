import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Returns top brands with their product counts, sorted desc.
 * Used by the NavOverlay "Marcas" hover state.
 */
export async function GET() {
  try {
    const groups = await prisma.product.groupBy({
      by: ["brand"],
      _count: { brand: true },
      orderBy: { _count: { brand: "desc" } },
      take: 12,
    });
    const brands = groups.map((g) => ({
      brand: g.brand,
      count: g._count.brand,
    }));
    return NextResponse.json({ brands });
  } catch (err) {
    console.error("[api/products/brands]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
