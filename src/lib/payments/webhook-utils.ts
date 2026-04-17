import { prisma } from "@/lib/prisma";

function getMockSecret(): string {
  return process.env.MOCK_WEBHOOK_SECRET || "mock-secret-dev";
}

export function verifyWebhookSignature(request: Request): boolean {
  const signature = request.headers.get("x-signature");
  return signature === getMockSecret();
}

const webhookPayloadSchema = {
  orderCode: (v: unknown) => typeof v === "string" && v.length > 0,
  providerTxnId: (v: unknown) => typeof v === "string",
  status: (v: unknown) => v === "APPROVED" || v === "DECLINED",
  amount: (v: unknown) => typeof v === "number" && v >= 0,
};

export function parseWebhookPayload(body: unknown): {
  orderCode: string;
  providerTxnId: string;
  status: "APPROVED" | "DECLINED";
  amount: number;
} | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (
    !webhookPayloadSchema.orderCode(o.orderCode) ||
    !webhookPayloadSchema.providerTxnId(o.providerTxnId) ||
    !webhookPayloadSchema.status(o.status) ||
    !webhookPayloadSchema.amount(o.amount)
  ) {
    return null;
  }
  return {
    orderCode: String(o.orderCode).trim().toUpperCase(),
    providerTxnId: String(o.providerTxnId),
    status: o.status as "APPROVED" | "DECLINED",
    amount: Number(o.amount),
  };
}

export async function handleWebhookApproved(
  orderCode: string,
  providerTxnId: string,
  provider: string,
  rawPayload: unknown
) {
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { items: true, stockReservations: true },
  });

  if (!order) {
    console.log("[webhook] Order not found:", orderCode);
    return { ok: false, error: "Order not found" };
  }

  if (order.status === "PAID") {
    console.log("[webhook] Order already paid:", orderCode);
    return { ok: true, alreadyPaid: true };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "PAID",
        paidAt: new Date(),
        paymentProvider: provider,
        paymentStatusRaw: JSON.stringify(rawPayload),
      },
    });

    await tx.paymentAttempt.updateMany({
      where: { orderId: order.id, provider },
      data: { status: "SUCCESS", providerTxnId, updatedAt: new Date() },
    });

    await tx.stockReservation.deleteMany({
      where: { orderId: order.id },
    });
  });

  // Fire-and-forget emails (never fail webhook on email error)
  try {
    const { sendOrderConfirmation, sendNewOrderNotification } = await import("@/lib/emails");
    await sendOrderConfirmation(order.id);
    await sendNewOrderNotification(order.id);
    console.log("[webhook] Emails enviados para orden", orderCode);
  } catch (emailError) {
    console.error("[webhook] Error enviando emails:", emailError);
  }

  console.log("[webhook] Payment APPROVED for order:", orderCode);
  return { ok: true };
}

export async function handleWebhookDeclined(
  orderCode: string,
  providerTxnId: string,
  provider: string,
  rawPayload: unknown
) {
  const order = await prisma.order.findUnique({
    where: { code: orderCode },
    include: { stockReservations: true },
  });

  if (!order) {
    console.log("[webhook] Order not found:", orderCode);
    return { ok: false, error: "Order not found" };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "CANCELLED",
        paymentProvider: provider,
        paymentStatusRaw: JSON.stringify(rawPayload),
      },
    });

    await tx.paymentAttempt.updateMany({
      where: { orderId: order.id, provider },
      data: { status: "FAILED", providerTxnId, updatedAt: new Date() },
    });

    for (const res of order.stockReservations) {
      await tx.product.update({
        where: { id: res.productId },
        data: { stock: { increment: res.qty } },
      });
    }

    await tx.stockReservation.deleteMany({
      where: { orderId: order.id },
    });
  });

  console.log("[webhook] Payment DECLINED for order:", orderCode);
  return { ok: true };
}
