import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createPaymentIntent } from "@/lib/payments/mock-adapter";
import {
  generateWompiSignature,
  buildWompiCheckoutUrl,
} from "@/lib/payments/wompi";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

const initSchema = z.object({
  orderCode: z.string().min(1, "orderCode requerido"),
  provider: z.enum(["wompi", "mercadopago"]),
});

const RESERVATION_MINUTES = 20;
const RECENT_ATTEMPT_MINUTES = 5;

function formatZodError(err: z.ZodError): string {
  return err.issues
    .map((i) => (typeof i.message === "string" ? i.message : i.path.join(".")))
    .join(". ");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = initSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: formatZodError(parsed.error) },
        { status: 400 }
      );
    }

    const { orderCode, provider } = parsed.data;
    const code = orderCode.trim().toUpperCase();

    const order = await prisma.order.findUnique({
      where: { code },
      include: { items: true },
    });

    if (!order) {
      console.log("[payments/init] Order not found:", code);
      return NextResponse.json({ error: "Orden no encontrada" }, { status: 404 });
    }

    if (order.status === "PAID") {
      console.log("[payments/init] Order already paid:", code);
      return NextResponse.json({ alreadyPaid: true });
    }

    const recentCutoff = new Date(Date.now() - RECENT_ATTEMPT_MINUTES * 60 * 1000);
    const recentAttempt = await prisma.paymentAttempt.findFirst({
      where: {
        orderId: order.id,
        provider,
        status: "PENDING",
        createdAt: { gte: recentCutoff },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recentAttempt?.paymentUrl) {
      console.log("[payments/init] Idempotent: returning existing attempt:", recentAttempt.id);
      return NextResponse.json({
        paymentUrl: recentAttempt.paymentUrl,
        providerIntentId: recentAttempt.providerIntentId,
      });
    }

    const products = await prisma.product.findMany({
      where: { id: { in: order.items.map((i) => i.productId) } },
      select: { id: true, stock: true, name: true },
    });

    const productMap = new Map(products.map((p) => [p.id, p]));
    const outOfStock: string[] = [];

    for (const item of order.items) {
      const p = productMap.get(item.productId);
      if (!p) outOfStock.push(item.productId);
      else {
        const reserved = await prisma.stockReservation.aggregate({
          where: {
            productId: item.productId,
            expiresAt: { gt: new Date() },
          },
          _sum: { qty: true },
        });
        const available = p.stock - (reserved._sum.qty ?? 0);
        if (available < item.quantity) outOfStock.push(p.name);
      }
    }

    if (outOfStock.length > 0) {
      console.log("[payments/init] Out of stock:", outOfStock);
      return NextResponse.json(
        { error: `Sin stock suficiente: ${outOfStock.join(", ")}` },
        { status: 400 }
      );
    }

    let paymentUrl: string;
    let providerIntentId: string;

    if (provider === "wompi" && isProduction) {
      const publicKey = process.env.WOMPI_PUBLIC_KEY;
      const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL || "https://essentia.example.com";

      if (!publicKey || !integritySecret) {
        console.error("[payments/init] Missing WOMPI_PUBLIC_KEY or WOMPI_INTEGRITY_SECRET");
        return NextResponse.json(
          { error: "Configuración de pago incompleta" },
          { status: 500 }
        );
      }

      const reference = `ESS-${code}`;
      const amountInCents = Math.round(order.total * 100);
      const currency = "COP";
      const redirectUrl = `${baseUrl}/orden/${code}?payment=return`;

      const signature = generateWompiSignature(
        reference,
        amountInCents,
        currency,
        integritySecret
      );

      paymentUrl = buildWompiCheckoutUrl({
        reference,
        amountInCents,
        currency,
        redirectUrl,
        publicKey,
        signature,
      });
      providerIntentId = reference;
    } else {
      const mock = createPaymentIntent(provider, code);
      paymentUrl = mock.paymentUrl;
      providerIntentId = mock.providerIntentId;
    }

    const expiresAt = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PAYMENT_PENDING", paymentProvider: provider },
      });

      for (const item of order.items) {
        await tx.stockReservation.create({
          data: {
            orderId: order.id,
            productId: item.productId,
            qty: item.quantity,
            expiresAt,
          },
        });
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.paymentAttempt.create({
        data: {
          orderId: order.id,
          provider,
          providerIntentId,
          status: "PENDING",
          paymentUrl,
        },
      });
    });

    console.log("[payments/init] Created intent for order:", code, "provider:", provider);

    return NextResponse.json({
      paymentUrl,
      providerIntentId,
    });
  } catch (err) {
    console.error("[payments/init] Error:", err);
    return NextResponse.json(
      { error: "Error al iniciar el pago" },
      { status: 500 }
    );
  }
}
