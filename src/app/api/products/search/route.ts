import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = (searchParams.get("q") || "").trim();

    if (q.length < 2) {
      return NextResponse.json({ items: [] });
    }

    const items = await prisma.product.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { brand: { contains: q, mode: "insensitive" } },
        ],
      },
      take: 6,
      orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
      include: { images: { orderBy: { position: "asc" }, take: 1 } },
    });

    return NextResponse.json({ items });
  } catch (err) {
    console.error("[search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}
