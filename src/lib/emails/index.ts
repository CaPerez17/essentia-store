import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

// Once the domain essentiaperfumes.co is verified in Resend, set in Vercel:
//   EMAIL_FROM=ESSENTIA <hola@essentiaperfumes.co>
// Until then, falls back to Resend's default sandbox sender.
const FROM = process.env.EMAIL_FROM || "ESSENTIA <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "devcamper97@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";
const WA_NUMBER = "573142156486";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Send order confirmation email to customer.
 * Premium on-brand HTML, inline CSS for cross-client compat.
 */
export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const firstName = order.shippingName.split(" ")[0] ?? "amigo";

  const itemsRows = order.items
    .map(
      (i, idx) => `
      <tr style="background:${idx % 2 === 0 ? "#ffffff" : "#fafaf8"};">
        <td style="padding:14px 16px;border-bottom:1px solid #eee9dd;font-family:Georgia,serif;color:#0D0D0D;font-size:14px;">
          <div style="font-weight:500;">${i.product.name}</div>
          <div style="font-size:11px;color:#6B6B6B;letter-spacing:0.1em;text-transform:uppercase;margin-top:4px;">${i.product.brand}</div>
        </td>
        <td style="padding:14px 16px;border-bottom:1px solid #eee9dd;text-align:center;color:#6B6B6B;font-size:13px;">${i.quantity}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #eee9dd;text-align:right;color:#6B6B6B;font-size:13px;">${fmt(i.price)}</td>
        <td style="padding:14px 16px;border-bottom:1px solid #eee9dd;text-align:right;color:#0D0D0D;font-size:13px;font-weight:500;">${fmt(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"><title>Tu orden ${order.code}</title></head>
<body style="margin:0;padding:0;background:#F5F0E8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0D0D0D;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F5F0E8;padding:0;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- HEADER -->
      <tr><td style="background:#0D0D0D;padding:36px 24px;text-align:center;">
        <div style="color:#C9A96E;font-size:18px;letter-spacing:0.45em;font-weight:300;">ESSENTIA</div>
        <div style="color:#6B6B6B;font-size:10px;letter-spacing:0.3em;text-transform:uppercase;margin-top:8px;">Perfumería de nicho · Colombia</div>
      </td></tr>

      <!-- SECTION 1: CONFIRMATION -->
      <tr><td style="background:#F5F0E8;padding:48px 24px 32px 24px;text-align:center;">
        <div style="display:inline-block;width:64px;height:64px;border-radius:50%;background:#C9A96E;line-height:64px;text-align:center;color:#0D0D0D;font-size:32px;font-weight:bold;margin-bottom:24px;">✓</div>
        <h1 style="font-family:Georgia,serif;font-size:32px;font-weight:300;color:#0D0D0D;margin:0 0 12px 0;line-height:1.15;">¡Tu pedido está confirmado!</h1>
        <p style="font-size:14px;color:#6B6B6B;margin:0 0 24px 0;line-height:1.6;">
          Gracias <strong style="color:#0D0D0D;">${firstName}</strong>, recibimos tu pago exitosamente.
        </p>
        <div style="display:inline-block;background:#C9A96E;color:#0D0D0D;padding:12px 24px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:500;">
          Orden ${order.code}
        </div>
      </td></tr>

      <!-- SECTION 2: ORDER SUMMARY -->
      <tr><td style="background:#ffffff;padding:32px 24px;">
        <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E;margin:0 0 16px 0;">Resumen del pedido</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          <thead>
            <tr style="background:#F5F0E8;">
              <th align="left" style="padding:12px 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B6B;font-weight:500;">Producto</th>
              <th align="center" style="padding:12px 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B6B;font-weight:500;">Cant.</th>
              <th align="right" style="padding:12px 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B6B;font-weight:500;">Unit.</th>
              <th align="right" style="padding:12px 16px;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#6B6B6B;font-weight:500;">Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsRows}</tbody>
        </table>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;">
          <tr><td style="padding:6px 16px;color:#6B6B6B;font-size:13px;">Subtotal</td>
              <td align="right" style="padding:6px 16px;color:#0D0D0D;font-size:13px;">${fmt(order.subtotal)}</td></tr>
          <tr><td style="padding:6px 16px;color:#6B6B6B;font-size:13px;">Envío</td>
              <td align="right" style="padding:6px 16px;color:#0D0D0D;font-size:13px;">${order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</td></tr>
          <tr><td style="padding:14px 16px;border-top:2px solid #C9A96E;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#0D0D0D;font-weight:500;">Total</td>
              <td align="right" style="padding:14px 16px;border-top:2px solid #C9A96E;font-family:Georgia,serif;font-size:24px;color:#C9A96E;font-weight:300;">${fmt(order.total)}</td></tr>
        </table>
      </td></tr>

      <!-- SECTION 3: SHIPPING INFO -->
      <tr><td style="background:#fafaf8;padding:32px 24px;">
        <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E;margin:0 0 16px 0;">Información de entrega</p>
        <div style="font-size:14px;color:#0D0D0D;line-height:1.7;">
          <strong>${order.shippingName}</strong><br>
          ${order.shippingAddr}<br>
          ${order.shippingCity}${order.shippingZip ? `, ${order.shippingZip}` : ""}<br>
          ${order.phone ? `Tel: <a href="tel:${order.phone}" style="color:#C9A96E;text-decoration:none;">${order.phone}</a><br>` : ""}
        </div>
        <div style="margin-top:20px;display:inline-block;border:1px solid #C9A96E;padding:10px 16px;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0D0D0D;">
          Tiempo estimado: <strong style="color:#C9A96E;">3-5 días hábiles</strong>
        </div>
      </td></tr>

      <!-- SECTION 4: NEXT STEPS -->
      <tr><td style="background:#ffffff;padding:36px 24px;">
        <p style="font-size:10px;letter-spacing:0.3em;text-transform:uppercase;color:#C9A96E;margin:0 0 24px 0;text-align:center;">¿Qué sigue?</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <div style="font-size:32px;margin-bottom:8px;">📦</div>
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0D0D0D;font-weight:500;margin-bottom:6px;">1. Preparamos</div>
              <div style="font-size:12px;color:#6B6B6B;line-height:1.5;">Tu pedido en 1-2 días hábiles</div>
            </td>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <div style="font-size:32px;margin-bottom:8px;">🚚</div>
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0D0D0D;font-weight:500;margin-bottom:6px;">2. Enviamos</div>
              <div style="font-size:12px;color:#6B6B6B;line-height:1.5;">Con guía de rastreo a tu correo</div>
            </td>
            <td width="33%" align="center" style="padding:0 8px;vertical-align:top;">
              <div style="font-size:32px;margin-bottom:8px;">✨</div>
              <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#0D0D0D;font-weight:500;margin-bottom:6px;">3. Recibes</div>
              <div style="font-size:12px;color:#6B6B6B;line-height:1.5;">Tu fragancia en casa</div>
            </td>
          </tr>
        </table>
      </td></tr>

      <!-- SECTION 5: SUPPORT -->
      <tr><td style="background:#F5F0E8;padding:32px 24px;text-align:center;">
        <p style="font-family:Georgia,serif;font-size:18px;color:#0D0D0D;margin:0 0 12px 0;font-style:italic;">¿Tienes preguntas?</p>
        <p style="font-size:13px;color:#6B6B6B;margin:0 0 20px 0;">Estamos aquí para ayudarte.</p>
        <a href="https://wa.me/${WA_NUMBER}" style="display:inline-block;background:#25D366;color:#ffffff;padding:12px 24px;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:500;margin:0 6px 8px 6px;">WhatsApp</a>
        <a href="mailto:hola@essentiaperfumes.co" style="display:inline-block;border:1px solid #0D0D0D;color:#0D0D0D;padding:11px 24px;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:500;margin:0 6px 8px 6px;">Escríbenos</a>
        <p style="font-size:12px;color:#6B6B6B;margin:16px 0 0 0;">
          <a href="mailto:hola@essentiaperfumes.co" style="color:#C9A96E;text-decoration:none;">hola@essentiaperfumes.co</a>
        </p>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="background:#0D0D0D;padding:32px 24px;text-align:center;">
        <div style="color:#C9A96E;font-size:11px;letter-spacing:0.4em;font-weight:300;margin-bottom:8px;">ESSENTIA</div>
        <div style="color:#6B6B6B;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:16px;">
          <a href="${BASE_URL}" style="color:#6B6B6B;text-decoration:none;">essentiaperfumes.co</a> · Montería, Colombia
        </div>
        <div style="color:#6B6B6B;font-size:10px;line-height:1.6;">
          Este correo fue enviado a ${order.email} porque realizaste una compra.
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  return resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `¡Tu orden ${order.code} está confirmada! — ESSENTIA`,
    html,
  });
}

/**
 * Send internal admin notification for new paid order.
 * Functional, action-oriented design for the logistics team.
 */
export async function sendNewOrderNotification(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: { include: { product: true } },
      paymentAttempts: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const itemsRows = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:10px 12px;border:1px solid #ddd;font-size:13px;">${i.product.name}</td>
        <td style="padding:10px 12px;border:1px solid #ddd;font-size:13px;color:#666;">${i.product.brand}</td>
        <td style="padding:10px 12px;border:1px solid #ddd;text-align:center;font-size:13px;font-weight:600;">${i.quantity}</td>
        <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-size:13px;">${fmt(i.price)}</td>
        <td style="padding:10px 12px;border:1px solid #ddd;text-align:right;font-size:13px;font-weight:600;">${fmt(i.price * i.quantity)}</td>
      </tr>`,
    )
    .join("");

  const txnId = order.paymentAttempts[0]?.providerTxnId ?? "—";
  const timestamp = new Date(order.paidAt ?? order.createdAt).toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "America/Bogota",
  });

  const html = `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f4f4f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#222;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
  <tr><td align="center">
    <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border:1px solid #ddd;">

      <!-- URGENT HEADER -->
      <tr><td style="background:#dc2626;color:#ffffff;padding:20px 24px;">
        <div style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;opacity:0.85;margin-bottom:4px;">ESSENTIA · Logística</div>
        <div style="font-size:22px;font-weight:600;">🛍️ NUEVA ORDEN RECIBIDA</div>
        <div style="font-size:12px;opacity:0.9;margin-top:4px;">${timestamp}</div>
      </td></tr>

      <tr><td style="padding:16px 24px;background:#dcfce7;color:#166534;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;font-weight:600;border-bottom:1px solid #ddd;">
        ✓ Pago confirmado por Wompi
      </td></tr>

      <!-- ORDER HEADER -->
      <tr><td style="padding:24px;background:#fafafa;border-bottom:1px solid #eee;">
        <div style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#666;margin-bottom:6px;">Orden</div>
        <div style="font-size:24px;font-weight:700;color:#0D0D0D;font-family:Georgia,serif;">${order.code}</div>
        <div style="font-size:24px;color:#dc2626;font-weight:700;margin-top:8px;">${fmt(order.total)} COP</div>
      </td></tr>

      <!-- CLIENTE -->
      <tr><td style="padding:24px;border-bottom:1px solid #eee;">
        <h3 style="font-size:14px;color:#dc2626;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 12px 0;">👤 Cliente</h3>
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:13px;width:100%;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;width:130px;">Nombre:</td><td style="font-weight:600;">${order.shippingName}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Email:</td><td><a href="mailto:${order.email}" style="color:#2563eb;">${order.email}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Teléfono:</td><td><a href="tel:${order.phone || ""}" style="color:#2563eb;">${order.phone || "—"}</a></td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Dirección:</td><td>${order.shippingAddr}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">Ciudad:</td><td><strong>${order.shippingCity}</strong>${order.shippingZip ? `, ${order.shippingZip}` : ""}</td></tr>
          ${order.shippingNotes ? `<tr><td style="padding:4px 12px 4px 0;color:#666;">Notas:</td><td style="font-style:italic;color:#444;">${order.shippingNotes}</td></tr>` : ""}
        </table>
      </td></tr>

      <!-- PRODUCTOS -->
      <tr><td style="padding:24px;border-bottom:1px solid #eee;">
        <h3 style="font-size:14px;color:#dc2626;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 12px 0;">📦 Productos a despachar</h3>
        <table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;">
          <thead><tr style="background:#f5f5f5;">
            <th align="left" style="padding:8px 12px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#444;">Producto</th>
            <th align="left" style="padding:8px 12px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#444;">Marca</th>
            <th align="center" style="padding:8px 12px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#444;">Cant.</th>
            <th align="right" style="padding:8px 12px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#444;">Unit.</th>
            <th align="right" style="padding:8px 12px;border:1px solid #ddd;font-size:11px;text-transform:uppercase;letter-spacing:0.1em;color:#444;">Total</th>
          </tr></thead>
          <tbody>${itemsRows}</tbody>
        </table>
        <div style="margin-top:14px;font-size:13px;text-align:right;">
          <div>Subtotal: <strong>${fmt(order.subtotal)}</strong></div>
          <div>Envío: <strong>${order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</strong></div>
          <div style="font-size:18px;color:#dc2626;margin-top:8px;"><strong>TOTAL: ${fmt(order.total)}</strong></div>
          <div style="font-size:12px;color:#666;margin-top:6px;">Método de pago: ${order.paymentProvider || "Wompi"}</div>
        </div>
      </td></tr>

      <!-- ACCIONES -->
      <tr><td style="padding:24px;background:#fef3c7;border-bottom:1px solid #eee;">
        <h3 style="font-size:14px;color:#92400e;text-transform:uppercase;letter-spacing:0.15em;margin:0 0 12px 0;">⚡ Acciones requeridas</h3>
        <ul style="margin:0;padding:0 0 0 4px;list-style:none;font-size:14px;color:#222;line-height:2;">
          <li>☐ Verificar stock físico</li>
          <li>☐ Empacar con packaging ESSENTIA</li>
          <li>☐ Generar guía de envío</li>
          <li>☐ Marcar como enviado en sistema</li>
          <li>☐ Enviar número de guía al cliente</li>
        </ul>
        <a href="${BASE_URL}/admin/orders/${order.id}" style="display:inline-block;margin-top:14px;background:#0D0D0D;color:#C9A96E;padding:12px 24px;text-decoration:none;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;font-weight:500;">Abrir orden en admin →</a>
      </td></tr>

      <!-- DATOS TÉCNICOS -->
      <tr><td style="padding:24px;background:#0D0D0D;color:#C9A96E;">
        <h3 style="font-size:11px;text-transform:uppercase;letter-spacing:0.25em;margin:0 0 12px 0;color:#C9A96E;">Datos técnicos</h3>
        <table role="presentation" cellpadding="0" cellspacing="0" style="font-size:11px;font-family:Menlo,Monaco,monospace;color:#aaa;">
          <tr><td style="padding:3px 12px 3px 0;color:#888;">order.id:</td><td>${order.id}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">order.code:</td><td>${order.code}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">wompi.txn_id:</td><td>${txnId}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">paid_at:</td><td>${order.paidAt?.toISOString() || "—"}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;color:#888;">provider:</td><td>${order.paymentProvider || "wompi"}</td></tr>
        </table>
      </td></tr>

      <!-- FOOTER -->
      <tr><td style="padding:14px 24px;background:#000;color:#666;font-size:10px;text-align:center;letter-spacing:0.15em;text-transform:uppercase;">
        ESSENTIA · Sistema interno · No responder este correo
      </td></tr>

    </table>
  </td></tr>
</table>
</body></html>`;

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `🛍️ Nueva orden ${order.code} — ${fmt(order.total)} COP`,
    html,
  });
}
