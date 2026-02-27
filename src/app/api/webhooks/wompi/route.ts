import { NextResponse } from "next/server";
import {
  verifyWompiEventSignature,
  parseWompiTransactionEvent,
} from "@/lib/payments/wompi-webhook";
import {
  verifyWebhookSignature,
  parseWebhookPayload,
  handleWebhookApproved,
  handleWebhookDeclined,
} from "@/lib/payments/webhook-utils";

export const dynamic = "force-dynamic";

const isProduction = process.env.NODE_ENV === "production";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Real Wompi payload: event === "transaction.updated"
  const wompiParsed = parseWompiTransactionEvent(body);
  if (wompiParsed) {
    const eventsSecret = process.env.WOMPI_EVENTS_SECRET;
    if (isProduction && eventsSecret) {
      const payload = body as { signature?: { checksum: string; properties: string[]; timestamp: number } };
      if (!payload.signature) {
        console.log("[webhook/wompi] Missing signature in production");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
      const valid = verifyWompiEventSignature(
        body as Parameters<typeof verifyWompiEventSignature>[0],
        eventsSecret
      );
      if (!valid) {
        console.log("[webhook/wompi] Invalid checksum");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    if (wompiParsed.status === "APPROVED") {
      const result = await handleWebhookApproved(
        wompiParsed.orderCode,
        wompiParsed.providerTxnId,
        "wompi",
        body
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ received: true });
    }

    const result = await handleWebhookDeclined(
      wompiParsed.orderCode,
      wompiParsed.providerTxnId,
      "wompi",
      body
    );
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ received: true });
  }

  // Mock/dev payload (orderCode, providerTxnId, status, amount)
  if (!isProduction && verifyWebhookSignature(request)) {
    const payload = parseWebhookPayload(body);
    if (payload) {
      if (payload.status === "APPROVED") {
        const result = await handleWebhookApproved(
          payload.orderCode,
          payload.providerTxnId,
          "wompi",
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
        "wompi",
        body
      );
      if (!result.ok) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ received: true });
    }
  }

  // Unknown payload: return 200 to avoid Wompi retries
  console.log("[webhook/wompi] Unrecognized payload, ignoring");
  return NextResponse.json({ received: true });
}
