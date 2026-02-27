import { NextResponse } from "next/server";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  handleWebhookApproved,
  handleWebhookDeclined,
} from "@/lib/payments/webhook-utils";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!verifyWebhookSignature(request)) {
    console.log("[webhook/mercadopago] Invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const payload = parseWebhookPayload(body);
  if (!payload) {
    console.log("[webhook/mercadopago] Invalid payload:", body);
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (payload.status === "APPROVED") {
    const result = await handleWebhookApproved(
      payload.orderCode,
      payload.providerTxnId,
      "mercadopago",
      body
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ received: true });
  }

  const result = await handleWebhookDeclined(
    payload.orderCode,
    payload.providerTxnId,
    "mercadopago",
    body
  );
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }
  return NextResponse.json({ received: true });
}
