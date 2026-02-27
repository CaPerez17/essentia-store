import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import {
  handleWebhookApproved,
  handleWebhookDeclined,
} from "@/lib/payments/webhook-utils";

export const dynamic = "force-dynamic";

/**
 * Dev/test endpoint to simulate webhook result without exposing MOCK_WEBHOOK_SECRET.
 * In production, disable or protect this route.
 */
const simulateSchema = z.object({
  orderCode: z.string().min(1),
  provider: z.enum(["wompi", "mercadopago"]),
  providerTxnId: z.string().min(1),
  status: z.enum(["APPROVED", "DECLINED"]),
  amount: z.number().min(0).optional(),
});

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = simulateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => i.message).join(", ") },
      { status: 400 }
    );
  }

  const { orderCode, provider, providerTxnId, status, amount: amountInput } = parsed.data;
  const code = orderCode.trim().toUpperCase();

  const order = await prisma.order.findUnique({
    where: { code },
    select: { total: true },
  });
  const amount = amountInput ?? (order ? Math.round(order.total * 100) : 0);

  const payload = { orderCode: code, providerTxnId, status, amount };

  if (status === "APPROVED") {
    const result = await handleWebhookApproved(
      code,
      providerTxnId,
      provider,
      payload
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, status: "PAID" });
  }

  const result = await handleWebhookDeclined(
    code,
    providerTxnId,
    provider,
    payload
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ success: true, status: "CANCELLED" });
}
