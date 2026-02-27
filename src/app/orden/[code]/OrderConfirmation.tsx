import Link from "next/link";
import { OrderPaymentActions } from "./OrderPaymentActions";
import type { Order } from "@prisma/client";
import type { OrderItem } from "@prisma/client";
import type { Product } from "@prisma/client";

interface OrderWithItems extends Order {
  items: (OrderItem & { product: Product })[];
}

const STATUS_COPY: Record<string, string> = {
  CREATED: "Orden creada. Elige método de pago.",
  PAYMENT_PENDING: "Pago pendiente. Si ya pagaste, espera confirmación.",
  PAID: "Pago confirmado. Preparando tu pedido.",
  CANCELLED: "Pedido cancelado.",
  REFUNDED: "Reembolsado.",
  pending: "Orden creada. Elige método de pago.",
};

export function OrderConfirmation({ order }: { order: OrderWithItems }) {
  const date = new Date(order.createdAt).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const statusCopy = STATUS_COPY[order.status] ?? order.status;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="border border-[var(--border)] p-6 bg-[var(--bg-card)]">
        <h1 className="text-2xl font-medium text-[var(--text)] mb-2">
          Pedido confirmado
        </h1>
        <p className="text-[var(--text-muted)] mb-2">
          Código: <strong>{order.code}</strong> · {date}
        </p>
        <p
          className={`mb-6 text-sm ${
            order.status === "PAID"
              ? "text-green-700"
              : order.status === "CANCELLED" || order.status === "REFUNDED"
                ? "text-red-600"
                : "text-[var(--text-muted)]"
          }`}
        >
          {statusCopy}
        </p>

        <div className="space-y-4 mb-8">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex justify-between items-center py-3 border-b border-[var(--border)] last:border-0"
            >
              <div>
                <p className="font-medium">{item.product.name}</p>
                <p className="text-sm text-[var(--text-muted)]">
                  {item.product.brand} · {item.quantity} ud.
                </p>
              </div>
              <p className="font-medium">
                €{(item.price * item.quantity).toFixed(2)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-between font-medium text-lg mb-8">
          <span>Total</span>
          <span>€{order.total.toFixed(2)}</span>
        </div>

        <div className="text-sm text-[var(--text-muted)] space-y-1 mb-8">
          <p>Envío a: {order.shippingName}</p>
          <p>
            {order.shippingAddr}, {order.shippingCity}
          </p>
        </div>

        <OrderPaymentActions order={order} />
      </div>

      <div className="mt-8">
        <Link
          href="/catalogo"
          className="text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Volver al catálogo
        </Link>
      </div>
    </div>
  );
}
