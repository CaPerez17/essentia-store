import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodySchema = z.object({
  productId: z.string().min(1),
  stock: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
});

function requireAdminKey(request: Request): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

export async function POST(request: Request) {
  if (!requireAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { productId, stock, price } = parsed.data;
    const update: { stock?: number; price?: number } = {};
    if (stock !== undefined) update.stock = stock;
    if (price !== undefined) update.price = price;

    if (Object.keys(update).length === 0) {
      return NextResponse.json(
        { error: "At least one of stock or price required" },
        { status: 400 }
      );
    }

    const product = await prisma.product.update({
      where: { id: productId },
      data: update,
    });

    return NextResponse.json({ ok: true, product });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update product" },
      { status: 500 }
    );
  }
}
