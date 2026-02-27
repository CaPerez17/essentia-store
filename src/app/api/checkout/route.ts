import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { checkoutSchema } from "@/lib/checkout-schema";

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => (typeof i.message === "string" ? i.message : i.path.join(".")))
    .join(". ");
}

function generateOrderCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "ESS-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const data = parsed.data;

    if (data.clientOrderId) {
      const existing = await prisma.order.findUnique({
        where: { clientOrderId: data.clientOrderId },
      });
      if (existing) {
        return NextResponse.json({ code: existing.code });
      }
    }

    const products = await prisma.product.findMany({
      where: { id: { in: data.items.map((i) => i.productId) } },
      select: { id: true, stock: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const outOfStock: string[] = [];

    for (const item of data.items) {
      const p = productMap.get(item.productId);
      if (!p) outOfStock.push(item.productId);
      else if (p.stock < item.quantity) outOfStock.push(p.name);
    }

    if (outOfStock.length > 0) {
      return NextResponse.json(
        { error: `Sin stock suficiente: ${outOfStock.join(", ")}` },
        { status: 400 }
      );
    }

    const code = await (async () => {
      let c = generateOrderCode();
      let exists = await prisma.order.findUnique({ where: { code: c } });
      while (exists) {
        c = generateOrderCode();
        exists = await prisma.order.findUnique({ where: { code: c } });
      }
      return c;
    })();

    await prisma.$transaction(async (tx) => {
      await tx.order.create({
        data: {
          code,
          clientOrderId: data.clientOrderId ?? null,
          email: data.email,
          phone: data.phone,
          shippingName: data.shippingName,
          shippingAddr: data.shippingAddr,
          shippingCity: data.shippingCity,
          shippingZip: data.shippingZip,
          shippingNotes: data.shippingNotes,
          subtotal: data.subtotal,
          shippingCost: data.shippingCost,
          total: data.total,
          status: "CREATED",
          items: {
            create: data.items.map((i) => ({
              productId: i.productId,
              quantity: i.quantity,
              price: i.price,
            })),
          },
        },
      });
      // Stock is decremented when payment is initiated (StockReservation), not at order creation
    });

    return NextResponse.json({ code });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al crear el pedido" },
      { status: 500 }
    );
  }
}
