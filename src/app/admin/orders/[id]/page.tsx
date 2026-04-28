import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrderDetailActions } from "./OrderDetailActions";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ key?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const adminKey = process.env.ADMIN_API_KEY;
  const ok = adminKey && sp.key === adminKey;

  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-medium mb-3">Orden — Admin</h1>
        <p className="text-sm text-gray-600 mb-6">
          Acceso restringido. Añade <code className="bg-gray-100 px-1.5 py-0.5 rounded">?key=ADMIN_API_KEY</code>.
        </p>
      </div>
    );
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      paymentAttempts: { orderBy: { updatedAt: "desc" } },
    },
  });

  if (!order) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-medium mb-3">Orden no encontrada</h1>
        <Link href={`/admin/orders?key=${encodeURIComponent(adminKey)}`} className="text-sm text-blue-600 hover:underline">
          ← Volver a órdenes
        </Link>
      </div>
    );
  }

  const dateLong = new Date(order.createdAt).toLocaleString("es-CO", {
    dateStyle: "full",
    timeStyle: "short",
  });
  const paidAt = order.paidAt
    ? new Date(order.paidAt).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" })
    : null;

  // Extract tracking number from shippingNotes if format `[TRACKING:XYZ]`
  const trackingMatch = order.shippingNotes?.match(/\[TRACKING:([^\]]+)\]/);
  const trackingNumber = trackingMatch?.[1] ?? null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm">
          <Link
            href={`/admin/orders?key=${encodeURIComponent(adminKey)}`}
            className="text-gray-500 hover:text-gray-900"
          >
            ← Todas las órdenes
          </Link>
        </nav>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Orden {order.code}</h1>
            <p className="text-sm text-gray-600">{dateLong}</p>
          </div>
          <span className={`px-3 py-1 text-xs font-medium uppercase tracking-wider rounded ${
            order.status === "PAID" ? "bg-emerald-100 text-emerald-800"
              : order.status === "SHIPPED" ? "bg-blue-100 text-blue-800"
              : order.status === "DELIVERED" ? "bg-emerald-200 text-emerald-900"
              : order.status === "CANCELLED" ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-700"
          }`}>{order.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-2 bg-white border border-gray-200 rounded p-5">
            <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-3">Productos</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="py-2 font-medium">Producto</th>
                  <th className="py-2 font-medium text-center">Cant.</th>
                  <th className="py-2 font-medium text-right">Unit.</th>
                  <th className="py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {order.items.map((it) => (
                  <tr key={it.id}>
                    <td className="py-3">
                      <div className="font-medium text-gray-900">{it.product.name}</div>
                      <div className="text-xs text-gray-500">{it.product.brand}</div>
                    </td>
                    <td className="py-3 text-center text-gray-700">{it.quantity}</td>
                    <td className="py-3 text-right text-gray-700">{fmt(it.price)}</td>
                    <td className="py-3 text-right font-medium text-gray-900">{fmt(it.price * it.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-4 pt-4 border-t border-gray-200 text-sm">
              <div className="flex justify-between text-gray-600 py-1"><span>Subtotal</span><span>{fmt(order.subtotal)}</span></div>
              <div className="flex justify-between text-gray-600 py-1"><span>Envío</span><span>{order.shippingCost > 0 ? fmt(order.shippingCost) : "Gratis"}</span></div>
              <div className="flex justify-between text-gray-900 font-semibold pt-2 border-t border-gray-200 mt-2 text-base">
                <span>Total</span><span>{fmt(order.total)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded p-5 space-y-4">
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Cliente</h2>
              <p className="text-sm font-medium text-gray-900">{order.shippingName}</p>
              <p className="text-xs text-gray-600">
                <a href={`mailto:${order.email}`} className="text-blue-600 hover:underline">{order.email}</a>
              </p>
              {order.phone && (
                <p className="text-xs text-gray-600">
                  <a href={`tel:${order.phone}`} className="text-blue-600 hover:underline">{order.phone}</a>
                </p>
              )}
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Envío</h2>
              <p className="text-sm text-gray-700">{order.shippingAddr}</p>
              <p className="text-sm text-gray-700">{order.shippingCity}{order.shippingZip ? `, ${order.shippingZip}` : ""}</p>
              {order.shippingNotes && (
                <p className="text-xs italic text-gray-500 mt-1">
                  {order.shippingNotes.replace(/\[TRACKING:[^\]]+\]/g, "").trim() || "—"}
                </p>
              )}
            </div>
            <div>
              <h2 className="text-xs uppercase tracking-wider text-gray-500 mb-2">Pago</h2>
              <p className="text-sm text-gray-700">{order.paymentProvider || "—"}</p>
              {paidAt && <p className="text-xs text-gray-500">Pagado: {paidAt}</p>}
              {trackingNumber && (
                <p className="text-xs text-gray-500 mt-1">Guía: <span className="font-mono text-gray-700">{trackingNumber}</span></p>
              )}
            </div>
          </div>
        </div>

        <OrderDetailActions
          orderId={order.id}
          status={order.status}
          adminKey={adminKey ?? ""}
          existingTracking={trackingNumber}
        />
      </div>
    </div>
  );
}
