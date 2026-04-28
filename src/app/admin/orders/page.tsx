import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { OrdersTable } from "./OrdersTable";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

function startOfDayCO(): Date {
  const now = new Date();
  // Bogota is UTC-5 (no DST). Build "today 00:00 in Bogota" as a UTC instant.
  const utcMs = now.getTime();
  const bogota = new Date(utcMs - 5 * 60 * 60 * 1000);
  bogota.setUTCHours(0, 0, 0, 0);
  return new Date(bogota.getTime() + 5 * 60 * 60 * 1000);
}
function startOfMonthCO(): Date {
  const todayCO = startOfDayCO();
  const dt = new Date(todayCO);
  // shift back to first of month in Bogota timezone
  const bg = new Date(dt.getTime() - 5 * 60 * 60 * 1000);
  bg.setUTCDate(1);
  return new Date(bg.getTime() + 5 * 60 * 60 * 1000);
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string; status?: string; q?: string }>;
}) {
  const sp = await searchParams;
  const adminKey = process.env.ADMIN_API_KEY;
  const ok = adminKey && sp.key === adminKey;

  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-medium mb-3">Admin — Órdenes</h1>
        <p className="text-sm text-gray-600 mb-6">
          Acceso restringido. Añade <code className="bg-gray-100 px-1.5 py-0.5 rounded">?key=ADMIN_API_KEY</code> a la URL.
        </p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← Volver al inicio</Link>
      </div>
    );
  }

  const todayStart = startOfDayCO();
  const monthStart = startOfMonthCO();

  // Build filter where-clause
  const statusFilter = sp.status && sp.status !== "all" ? sp.status.toUpperCase() : undefined;
  const q = sp.q?.trim();

  const where = {
    ...(statusFilter ? { status: statusFilter } : {}),
    ...(q
      ? {
          OR: [
            { shippingName: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { code: { contains: q.toUpperCase() } },
          ],
        }
      : {}),
  };

  const [orders, todayCount, todayRevenue, monthCount, monthRevenue] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { items: { include: { product: { select: { name: true } } } } },
      take: 200,
    }),
    prisma.order.count({ where: { paidAt: { gte: todayStart } } }),
    prisma.order.aggregate({ where: { paidAt: { gte: todayStart } }, _sum: { total: true } }),
    prisma.order.count({ where: { paidAt: { gte: monthStart } } }),
    prisma.order.aggregate({ where: { paidAt: { gte: monthStart } }, _sum: { total: true } }),
  ]);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-900">← Inicio</Link>
          <Link href={`/admin/products`} className="text-gray-500 hover:text-gray-900">Productos →</Link>
        </nav>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Órdenes</h1>
        <p className="text-sm text-gray-600 mb-8">Panel interno de gestión.</p>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <Stat label="Órdenes hoy" value={todayCount.toString()} />
          <Stat label="Ventas hoy" value={fmt(todayRevenue._sum.total ?? 0)} accent />
          <Stat label="Órdenes mes" value={monthCount.toString()} />
          <Stat label="Ventas mes" value={fmt(monthRevenue._sum.total ?? 0)} accent />
        </div>

        <OrdersTable
          orders={orders.map((o) => ({
            id: o.id,
            code: o.code,
            createdAt: o.createdAt.toISOString(),
            shippingName: o.shippingName,
            email: o.email,
            shippingCity: o.shippingCity,
            shippingZip: o.shippingZip,
            productNames: o.items.map((i) => i.product.name).join(", "),
            total: o.total,
            status: o.status,
          }))}
          adminKey={adminKey ?? ""}
          currentStatus={sp.status ?? "all"}
          currentQuery={q ?? ""}
        />
      </div>
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="bg-white border border-gray-200 px-4 py-4 rounded">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">{label}</p>
      <p className={`text-xl font-semibold ${accent ? "text-emerald-700" : "text-gray-900"}`}>{value}</p>
    </div>
  );
}
