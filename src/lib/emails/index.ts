import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "ESSENTIA <onboarding@resend.dev>";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "devcamper97@gmail.com";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://essentia-store.vercel.app";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

/**
 * Send order confirmation email to customer (dark luxury theme).
 */
export async function sendOrderConfirmation(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const itemsHtml = order.items
    .map(
      (i) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(201,169,110,0.1);color:#e2d9c8;">
          <div style="font-family:Georgia,serif;font-size:14px;">${i.product.brand} — ${i.product.name}</div>
          <div style="font-size:11px;color:#7a7060;margin-top:2px;">Cantidad: ${i.quantity}</div>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(201,169,110,0.1);color:#c9a96e;text-align:right;font-size:13px;">
          ${fmt(i.price * i.quantity)}
        </td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#0c0b09;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0c0b09;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#0c0b09;">

          <!-- Header -->
          <tr><td style="padding:20px 0 40px 0;text-align:center;border-bottom:1px solid rgba(201,169,110,0.15);">
            <div style="color:#c9a96e;font-size:14px;letter-spacing:6px;font-weight:normal;">E S S E N T I A</div>
          </td></tr>

          <!-- Title -->
          <tr><td style="padding:40px 0 20px 0;text-align:center;">
            <div style="color:#c9a96e;font-size:9px;letter-spacing:4px;text-transform:uppercase;margin-bottom:16px;">Confirmación de pedido</div>
            <h1 style="font-family:Georgia,serif;color:#e2d9c8;font-size:32px;font-weight:300;margin:0;line-height:1.2;">Tu orden está confirmada</h1>
          </td></tr>

          <!-- Order code box -->
          <tr><td style="padding:30px 20px;text-align:center;">
            <div style="display:inline-block;border:1px solid rgba(201,169,110,0.3);padding:20px 40px;">
              <div style="color:#7a7060;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:8px;">Código de orden</div>
              <div style="color:#c9a96e;font-size:24px;letter-spacing:3px;font-family:Georgia,serif;">${order.code}</div>
            </div>
          </td></tr>

          <!-- Greeting -->
          <tr><td style="padding:20px 20px;">
            <p style="color:#e2d9c8;font-size:14px;line-height:1.6;margin:0;">
              Hola ${order.shippingName.split(" ")[0]}, gracias por tu compra en Essentia. Hemos recibido tu pago correctamente.
            </p>
          </td></tr>

          <!-- Items table -->
          <tr><td style="padding:20px;">
            <div style="color:#c9a96e;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:16px;padding-bottom:12px;border-bottom:1px solid rgba(201,169,110,0.15);">Tu pedido</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              ${itemsHtml}
            </table>
          </td></tr>

          <!-- Totals -->
          <tr><td style="padding:20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="color:#7a7060;font-size:12px;padding:4px 0;">Subtotal</td>
                <td style="color:#e2d9c8;font-size:12px;padding:4px 0;text-align:right;">${fmt(order.subtotal)}</td>
              </tr>
              <tr>
                <td style="color:#7a7060;font-size:12px;padding:4px 0;">Envío</td>
                <td style="color:#e2d9c8;font-size:12px;padding:4px 0;text-align:right;">${order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</td>
              </tr>
              <tr>
                <td style="padding:16px 0 0 0;border-top:1px solid rgba(201,169,110,0.15);color:#c9a96e;font-size:11px;letter-spacing:2px;text-transform:uppercase;">Total</td>
                <td style="padding:16px 0 0 0;border-top:1px solid rgba(201,169,110,0.15);color:#c9a96e;font-size:18px;text-align:right;font-family:Georgia,serif;">${fmt(order.total)}</td>
              </tr>
            </table>
          </td></tr>

          <!-- Shipping -->
          <tr><td style="padding:30px 20px;">
            <div style="color:#c9a96e;font-size:9px;letter-spacing:3px;text-transform:uppercase;margin-bottom:12px;">Dirección de envío</div>
            <div style="color:#e2d9c8;font-size:13px;line-height:1.6;">
              ${order.shippingName}<br>
              ${order.shippingAddr}<br>
              ${order.shippingCity}${order.shippingZip ? `, ${order.shippingZip}` : ""}<br>
              ${order.phone ? `Tel: ${order.phone}<br>` : ""}
              ${order.shippingNotes ? `<div style="color:#7a7060;font-size:11px;margin-top:8px;font-style:italic;">Notas: ${order.shippingNotes}</div>` : ""}
            </div>
          </td></tr>

          <!-- Contact message -->
          <tr><td style="padding:20px;text-align:center;">
            <div style="border:1px solid rgba(201,169,110,0.2);padding:20px;background:rgba(201,169,110,0.03);">
              <p style="color:#e2d9c8;font-size:13px;line-height:1.6;margin:0;font-style:italic;font-family:Georgia,serif;">
                Nos contactaremos contigo en menos de 24 horas para coordinar tu envío.
              </p>
            </div>
          </td></tr>

          <!-- Footer -->
          <tr><td style="padding:40px 20px 20px 20px;text-align:center;border-top:1px solid rgba(201,169,110,0.1);">
            <div style="color:#7a7060;font-size:10px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Perfumería de autor · Colombia</div>
            <a href="${BASE_URL}" style="color:#c9a96e;text-decoration:none;font-size:11px;letter-spacing:2px;">essentia-store.vercel.app</a>
          </td></tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return resend.emails.send({
    from: FROM,
    to: order.email,
    subject: `Tu orden ${order.code} está confirmada — ESSENTIA`,
    html,
  });
}

/**
 * Send plain admin notification email for new paid order.
 */
export async function sendNewOrderNotification(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new Error(`Order ${orderId} not found`);

  const itemsHtml = order.items
    .map(
      (i) =>
        `<tr><td style="padding:6px 12px;border:1px solid #ddd;">${i.product.brand} — ${i.product.name}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:center;">${i.quantity}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:right;">${fmt(i.price)}</td><td style="padding:6px 12px;border:1px solid #ddd;text-align:right;"><strong>${fmt(i.price * i.quantity)}</strong></td></tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html><body style="font-family:-apple-system,Arial,sans-serif;background:#fff;color:#111;padding:20px;">
  <h2 style="margin:0 0 8px 0;">🎉 Nueva venta — ${order.code}</h2>
  <p style="color:#555;margin:0 0 24px 0;">Total: <strong>${fmt(order.total)}</strong></p>

  <h3 style="margin:16px 0 8px 0;font-size:14px;">Cliente</h3>
  <table cellpadding="0" cellspacing="0" style="font-size:13px;">
    <tr><td style="padding:2px 12px 2px 0;color:#666;">Nombre:</td><td>${order.shippingName}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666;">Email:</td><td><a href="mailto:${order.email}">${order.email}</a></td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666;">Teléfono:</td><td>${order.phone || "—"}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666;">Ciudad:</td><td>${order.shippingCity}</td></tr>
    <tr><td style="padding:2px 12px 2px 0;color:#666;">Dirección:</td><td>${order.shippingAddr}${order.shippingZip ? `, ${order.shippingZip}` : ""}</td></tr>
    ${order.shippingNotes ? `<tr><td style="padding:2px 12px 2px 0;color:#666;">Notas:</td><td>${order.shippingNotes}</td></tr>` : ""}
  </table>

  <h3 style="margin:24px 0 8px 0;font-size:14px;">Productos</h3>
  <table cellpadding="0" cellspacing="0" style="font-size:13px;border-collapse:collapse;width:100%;">
    <thead><tr style="background:#f5f5f5;">
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:left;">Producto</th>
      <th style="padding:8px 12px;border:1px solid #ddd;">Cant.</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:right;">Unit.</th>
      <th style="padding:8px 12px;border:1px solid #ddd;text-align:right;">Total</th>
    </tr></thead>
    <tbody>${itemsHtml}</tbody>
  </table>

  <div style="margin-top:16px;font-size:13px;">
    <div>Subtotal: ${fmt(order.subtotal)}</div>
    <div>Envío: ${order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</div>
    <div style="font-size:16px;margin-top:8px;"><strong>TOTAL: ${fmt(order.total)}</strong></div>
  </div>
</body></html>`;

  return resend.emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `Nueva venta ${order.code} — ${fmt(order.total)} COP`,
    html,
  });
}
