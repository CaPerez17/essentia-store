import Link from "next/link";
import { OrderPaymentActions } from "./OrderPaymentActions";
import { resolveImageUrl } from "@/lib/image-url";
import type { Order, OrderItem, Product, ProductImage } from "@prisma/client";

interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product & { images?: ProductImage[] } })[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const STATUS_COPY: Record<string, { label: string; tone: string }> = {
  CREATED: { label: "Orden creada — elige método de pago", tone: "text-[#6B6B6B]" },
  PAYMENT_PENDING: { label: "Pago pendiente — esperando confirmación", tone: "text-amber-600" },
  PAID: { label: "Pago confirmado · preparando tu pedido", tone: "text-emerald-700" },
  SHIPPED: { label: "Tu pedido está en camino", tone: "text-blue-700" },
  DELIVERED: { label: "Pedido entregado", tone: "text-emerald-700" },
  CANCELLED: { label: "Pedido cancelado", tone: "text-red-600" },
  REFUNDED: { label: "Reembolsado", tone: "text-red-600" },
};

export function OrderConfirmation({ order }: { order: OrderWithItems }) {
  const isPaid = order.status === "PAID" || order.status === "SHIPPED" || order.status === "DELIVERED";
  const status = STATUS_COPY[order.status] ?? { label: order.status, tone: "text-[#6B6B6B]" };
  const date = new Date(order.createdAt).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-[#F5F0E8] min-h-screen">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">

        {/* SUCCESS HERO (only when paid) */}
        {isPaid ? (
          <div className="text-center mb-12">
            {/* Animated checkmark */}
            <div className="order-success-circle inline-flex items-center justify-center w-20 h-20 rounded-full bg-[#C9A96E] mb-7">
              <svg className="order-success-check" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0D0D0D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 12.5l5 5L20 7" />
              </svg>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-3">Confirmación de compra</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D] leading-[1.1] mb-3">
              ¡Gracias por tu compra!
            </h1>
            <p className="text-sm text-[#6B6B6B] leading-relaxed mb-2">
              Tu pedido <strong className="text-[#0D0D0D]">{order.code}</strong> está confirmado.
            </p>
            <p className="text-sm text-[#6B6B6B] leading-relaxed">
              Recibirás un email de confirmación en <strong className="text-[#0D0D0D]">{order.email}</strong>
            </p>
          </div>
        ) : (
          <div className="text-center mb-12">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#C9A96E] mb-3">Tu pedido</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-light text-[#0D0D0D] leading-[1.1] mb-3">
              Pedido {order.code}
            </h1>
            <p className={`text-sm leading-relaxed ${status.tone}`}>{status.label}</p>
            <p className="text-xs text-[#6B6B6B] mt-1">{date}</p>
          </div>
        )}

        {/* ORDER ITEMS */}
        <section className="bg-white border border-[#C9A96E]/20 mb-6">
          <div className="px-6 py-4 border-b border-[#C9A96E]/15">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">Resumen del pedido</p>
          </div>
          <ul className="divide-y divide-[#eee9dd]">
            {order.items.map((item) => {
              const imgKey = item.product.images?.[0]?.key;
              const imgUrl = imgKey ? resolveImageUrl(imgKey) : null;
              return (
                <li key={item.id} className="flex items-center gap-4 px-6 py-4">
                  <div className="w-16 h-16 bg-[#F5F0E8] flex items-center justify-center shrink-0 border border-[#C9A96E]/15">
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={imgUrl} alt={item.product.name} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-[9px] text-[#C9A96E] uppercase tracking-widest">{item.product.brand.slice(0, 3)}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#6B6B6B] mb-1">{item.product.brand}</p>
                    <p className="font-serif text-base text-[#0D0D0D] leading-tight truncate">{item.product.name}</p>
                    <p className="text-xs text-[#6B6B6B] mt-1">Cantidad: {item.quantity}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif text-base text-[#0D0D0D]">{fmt(item.price * item.quantity)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="px-6 py-4 border-t border-[#C9A96E]/15 bg-[#fafaf8]">
            <div className="flex justify-between text-sm text-[#6B6B6B] mb-1">
              <span>Subtotal</span><span>{fmt(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#6B6B6B] mb-3">
              <span>Envío</span><span>{order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</span>
            </div>
            <div className="flex justify-between items-baseline pt-3 border-t border-[#C9A96E]/30">
              <span className="text-[10px] uppercase tracking-[0.3em] text-[#0D0D0D]">Total</span>
              <span className="font-serif text-2xl text-[#C9A96E]">{fmt(order.total)}</span>
            </div>
          </div>
        </section>

        {/* SHIPPING */}
        <section className="bg-white border border-[#C9A96E]/20 mb-6">
          <div className="px-6 py-4 border-b border-[#C9A96E]/15">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C9A96E]">Información de entrega</p>
          </div>
          <div className="px-6 py-5 text-sm text-[#0D0D0D] leading-relaxed">
            <p className="font-medium mb-1">{order.shippingName}</p>
            <p className="text-[#6B6B6B]">{order.shippingAddr}</p>
            <p className="text-[#6B6B6B]">
              {order.shippingCity}{order.shippingZip ? `, ${order.shippingZip}` : ""}
            </p>
            {order.phone && <p className="text-[#6B6B6B]">Tel: {order.phone}</p>}
            <div className="inline-block mt-4 px-3 py-1.5 border border-[#C9A96E] text-[10px] uppercase tracking-[0.18em] text-[#0D0D0D]">
              Tiempo estimado: <span className="text-[#C9A96E] font-medium">3-5 días hábiles</span>
            </div>
          </div>
        </section>

        {/* Pay actions if not yet paid */}
        {!isPaid && order.status !== "CANCELLED" && (
          <div className="bg-white border border-[#C9A96E]/20 px-6 py-5 mb-6">
            <OrderPaymentActions order={order} />
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Link
            href="/catalogo"
            className="flex-1 inline-flex items-center justify-center bg-[#C9A96E] text-[#0D0D0D] px-6 py-4 text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#0D0D0D] hover:text-[#C9A96E] transition-colors"
          >
            Seguir comprando →
          </Link>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center border border-[#0D0D0D] text-[#0D0D0D] px-6 py-4 text-[10px] uppercase tracking-[0.25em] font-medium hover:bg-[#0D0D0D] hover:text-white transition-colors"
          >
            Ir al inicio
          </Link>
        </div>

        {/* Support */}
        <p className="text-center text-xs text-[#6B6B6B] mt-10">
          ¿Preguntas?{" "}
          <a href="https://wa.me/573142156486" className="text-[#C9A96E] hover:underline">WhatsApp</a>
          {" · "}
          <a href="mailto:hola@essentiaperfumes.co" className="text-[#C9A96E] hover:underline">hola@essentiaperfumes.co</a>
        </p>
      </div>
    </div>
  );
}
