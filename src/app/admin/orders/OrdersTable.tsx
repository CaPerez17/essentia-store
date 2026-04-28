"use client";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState } from "react";

interface OrderRow {
  id: string;
  code: string;
  createdAt: string;
  shippingName: string;
  email: string;
  shippingCity: string;
  shippingZip: string | null;
  productNames: string;
  total: number;
  status: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

const STATUS_BADGE: Record<string, string> = {
  CREATED: "bg-gray-100 text-gray-700",
  PAYMENT_PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-blue-100 text-blue-800",
  DELIVERED: "bg-emerald-200 text-emerald-900",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-red-100 text-red-700",
};

const STATUS_OPTIONS = [
  { value: "all", label: "Todos" },
  { value: "CREATED", label: "Creadas" },
  { value: "PAID", label: "Pagadas" },
  { value: "SHIPPED", label: "Enviadas" },
  { value: "DELIVERED", label: "Entregadas" },
  { value: "CANCELLED", label: "Canceladas" },
];

export function OrdersTable({
  orders,
  adminKey,
  currentStatus,
  currentQuery,
}: {
  orders: OrderRow[];
  adminKey: string;
  currentStatus: string;
  currentQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(currentQuery);

  const buildHref = (overrides: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    Object.entries(overrides).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
    });
    return `/admin/orders?${params.toString()}`;
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(buildHref({ q: query || undefined }));
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => {
            const active = currentStatus === opt.value;
            return (
              <Link
                key={opt.value}
                href={buildHref({ status: opt.value === "all" ? undefined : opt.value })}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  active
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-700 border-gray-200 hover:border-gray-400"
                }`}
              >
                {opt.label}
              </Link>
            );
          })}
        </div>
        <form onSubmit={onSearch} className="flex-1 md:max-w-xs md:ml-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre, email, código…"
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:border-gray-900"
          />
        </form>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3 font-medium">Orden</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Ciudad</th>
                <th className="px-4 py-3 font-medium">Productos</th>
                <th className="px-4 py-3 font-medium text-right">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 text-sm">
                    No hay órdenes que coincidan con el filtro.
                  </td>
                </tr>
              )}
              {orders.map((o) => {
                const date = new Date(o.createdAt).toLocaleString("es-CO", {
                  dateStyle: "short",
                  timeStyle: "short",
                });
                return (
                  <tr key={o.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-700">{o.code}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs whitespace-nowrap">{date}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{o.shippingName}</div>
                      <div className="text-xs text-gray-500">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">
                      {o.shippingCity}{o.shippingZip ? `, ${o.shippingZip}` : ""}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs max-w-[200px] truncate" title={o.productNames}>
                      {o.productNames}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                      {fmt(o.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded ${STATUS_BADGE[o.status] ?? "bg-gray-100 text-gray-700"}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}?key=${encodeURIComponent(adminKey)}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Ver →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3">{orders.length} orden(es) — máx. 200 más recientes.</p>
    </div>
  );
}
