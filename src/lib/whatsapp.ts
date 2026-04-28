/**
 * WhatsApp notifications for ESSENTIA partners — via CallMeBot.
 *
 * CallMeBot is a free WhatsApp bridge: each partner registers their number
 * with the bot once and receives a personal API key. Messages are sent via:
 *
 *   GET https://api.callmebot.com/whatsapp.php?phone={E164}&text={url-encoded}&apikey={key}
 *
 * Configure via env (one key per partner):
 *   CALLMEBOT_API_KEY_1   → 573142156486 (Camilo)
 *   CALLMEBOT_API_KEY_2   → 573105400071 (socio)
 *
 * If a key is missing, that partner is skipped with a warning. Sends never
 * throw — failures are logged so the webhook flow keeps moving.
 */

import { prisma } from "@/lib/prisma";

const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";

const REQUEST_TIMEOUT_MS = 10_000;
const DELAY_BETWEEN_SENDS_MS = 2_000;

interface Partner {
  label: string;
  phone: string;
  envKey: string;
}

const PARTNERS: Partner[] = [
  { label: "Camilo", phone: "573142156486", envKey: "CALLMEBOT_API_KEY_1" },
  { label: "Socio", phone: "573105400071", envKey: "CALLMEBOT_API_KEY_2" },
];

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Low-level send via CallMeBot. Returns { ok, error }.
 * Never throws — fetch errors and timeouts are caught.
 */
async function sendViaCallMeBot(
  phone: string,
  apiKey: string,
  message: string,
): Promise<{ ok: boolean; error?: string }> {
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetch(url, { method: "GET", signal: controller.signal });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status} ${text.slice(0, 200)}` };
    }
    // CallMeBot returns 200 with HTML body even for some errors — log body
    // length only; treat HTTP 200 as success.
    return { ok: true };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, error: `timeout after ${REQUEST_TIMEOUT_MS}ms` };
    }
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Send formatted order notification to all partners via CallMeBot.
 * Failures per partner are logged but never thrown.
 */
export async function sendWhatsAppOrderNotification(
  orderId: string,
): Promise<{
  sent: number;
  failed: number;
  skipped: number;
  results: Array<{ to: string; label: string; ok: boolean; skipped?: boolean; error?: string }>;
}> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) {
    console.error("[whatsapp] order not found:", orderId);
    return { sent: 0, failed: 0, skipped: 0, results: [] };
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

  const results: Array<{
    to: string;
    label: string;
    ok: boolean;
    skipped?: boolean;
    error?: string;
  }> = [];
  let sent = 0;
  let failed = 0;
  let skipped = 0;
  let firstSendDone = false;

  for (const partner of PARTNERS) {
    const apiKey = process.env[partner.envKey];

    if (!apiKey) {
      console.warn(
        `[whatsapp] ${partner.envKey} not set — skipping ${partner.label} (${partner.phone})`,
      );
      results.push({
        to: partner.phone,
        label: partner.label,
        ok: false,
        skipped: true,
        error: `missing ${partner.envKey}`,
      });
      skipped++;
      continue;
    }

    // 2s delay between successive real sends (CallMeBot rate-limit hygiene)
    if (firstSendDone) await sleep(DELAY_BETWEEN_SENDS_MS);

    const result = await sendViaCallMeBot(partner.phone, apiKey, message);
    firstSendDone = true;

    results.push({ to: partner.phone, label: partner.label, ...result });
    if (result.ok) {
      sent++;
    } else {
      failed++;
      console.error(
        `[whatsapp] callmebot failed → ${partner.label} (${partner.phone}):`,
        result.error,
      );
    }
  }

  console.log(
    `[whatsapp] order ${order.code} — sent: ${sent}, failed: ${failed}, skipped: ${skipped}`,
  );
  return { sent, failed, skipped, results };
}
