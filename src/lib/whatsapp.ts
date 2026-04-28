/**
 * WhatsApp notifications for ESSENTIA partners.
 *
 * Uses WhatsApp Cloud API (graph.facebook.com). Configure via env:
 *   WHATSAPP_API_TOKEN          — long-lived access token
 *   WHATSAPP_PHONE_NUMBER_ID    — your business phone number id
 *   WHATSAPP_PARTNERS           — optional CSV override of recipient numbers
 *
 * If env vars are missing, calls are no-ops (logged to console). This keeps
 * webhooks unblocked in dev / preview.
 */

import { prisma } from "@/lib/prisma";

const PARTNERS_DEFAULT = ["573142156486", "573105400071"];
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

function getPartners(): string[] {
  const raw = process.env.WHATSAPP_PARTNERS;
  if (raw) {
    return raw
      .split(",")
      .map((n) => n.trim().replace(/[^0-9]/g, ""))
      .filter(Boolean);
  }
  return PARTNERS_DEFAULT;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Low-level send via WhatsApp Cloud API.
 * Returns { ok, error }.
 */
async function sendWhatsAppText(
  to: string,
  body: string,
): Promise<{ ok: boolean; error?: string }> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(
      `[whatsapp] (no-op, missing creds) → ${to}\n${body.slice(0, 80)}…`,
    );
    return { ok: true };
  }

  try {
    const url = `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { preview_url: true, body },
      }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return { ok: false, error: `${res.status} ${errText.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Send formatted order notification to all partners.
 * Failures are logged but never thrown (won't block the webhook flow).
 */
export async function sendWhatsAppOrderNotification(
  orderId: string,
): Promise<{ sent: number; failed: number; results: Array<{ to: string; ok: boolean; error?: string }> }> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) {
    console.error("[whatsapp] order not found:", orderId);
    return { sent: 0, failed: 0, results: [] };
  }

  const itemsLines = order.items
    .map(
      (i) =>
        `   • ${i.quantity}× ${i.product.brand} — ${i.product.name} (${fmt(i.price * i.quantity)})`,
    )
    .join("\n");

  const message = `🛍️ *NUEVA VENTA ESSENTIA*
━━━━━━━━━━━━━━━━━━━

📋 *Orden:* ${order.code}
👤 *Cliente:* ${order.shippingName}
📱 *Tel:* ${order.phone || "—"}
📍 *Ciudad:* ${order.shippingCity}${order.shippingZip ? `, ${order.shippingZip}` : ""}

🧴 *PRODUCTOS:*
${itemsLines}

💰 *TOTAL:* ${fmt(order.total)} COP

✅ Pago confirmado por Wompi

📦 *ACCIÓN REQUERIDA:*
Preparar y despachar pedido

🔗 Ver orden: ${BASE_URL}/admin/orders/${order.id}

━━━━━━━━━━━━━━━━━━━
_Essentia · Sistema automático_`;

  const partners = getPartners();
  const results: Array<{ to: string; ok: boolean; error?: string }> = [];
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < partners.length; i++) {
    const to = partners[i]!;
    const result = await sendWhatsAppText(to, message);
    results.push({ to, ...result });
    if (result.ok) sent++;
    else {
      failed++;
      console.error(`[whatsapp] failed → ${to}:`, result.error);
    }
    // 2s delay between messages (avoid rate-limits / spam-detection)
    if (i < partners.length - 1) await sleep(2000);
  }

  console.log(
    `[whatsapp] order ${order.code} — sent: ${sent}/${partners.length}, failed: ${failed}`,
  );
  return { sent, failed, results };
}
