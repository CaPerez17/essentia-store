import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 50);
  const category = searchParams.get("categoria");
  const q = searchParams.get("q")?.trim();

  const where: { category?: string; title?: { contains: string } } = {};
  if (category) where.category = category;
  if (q) where.title = { contains: q };

  const items = await prisma.newsItem.findMany({
    where: Object.keys(where).length > 0 ? where : undefined,
    orderBy: { publishedAt: "desc" },
    take: limit,
  });

  return NextResponse.json(items);
}
