import Link from "next/link";
import { getDashboardStats } from "@/lib/admin-stats";
import { resolveImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  const sp = await searchParams;
  const adminKey = process.env.ADMIN_API_KEY;
  const ok = adminKey && sp.key === adminKey;

  if (!ok) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-xl font-medium mb-3">Admin — Dashboard</h1>
        <p className="text-sm text-gray-600 mb-6">
          Acceso restringido. Añade{" "}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded">?key=ADMIN_API_KEY</code>{" "}
          a la URL.
        </p>
        <Link href="/" className="text-sm text-blue-600 hover:underline">
          ← Volver al inicio
        </Link>
      </div>
    );
  }

  const stats = await getDashboardStats();

  // Max revenue across the 30-day window — used to scale the bars.
  const maxRevenue = Math.max(1, ...stats.daily.map((d) => d.revenue));

  // % delta vs yesterday for the "today" cards
  const todayDeltaRevenue =
    stats.revenue.yesterday > 0
      ? ((stats.revenue.today - stats.revenue.yesterday) / stats.revenue.yesterday) * 100
      : null;
  const todayDeltaOrders =
    stats.orders.yesterday > 0
      ? ((stats.orders.today - stats.orders.yesterday) / stats.orders.yesterday) * 100
      : null;

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <nav className="mb-6 text-sm flex items-center justify-between">
          <Link href="/" className="text-gray-500 hover:text-gray-900">
            ← Inicio
          </Link>
          <div className="flex gap-4">
            <Link
              href={`/admin/orders?key=${adminKey}`}
              className="text-gray-500 hover:text-gray-900"
            >
              Órdenes →
            </Link>
            <Link
              href={`/admin/products?key=${adminKey}`}
              className="text-gray-500 hover:text-gray-900"
            >
              Productos →
            </Link>
          </div>
        </nav>

        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Dashboard</h1>
        <p className="text-sm text-gray-600 mb-8">
          Métricas de ventas en tiempo real (Bogotá UTC-5).
        </p>

        {/* Revenue cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <Card
            label="Ventas hoy"
            value={fmt(stats.revenue.today)}
            delta={todayDeltaRevenue}
            accent
          />
          <Card label="Ventas ayer" value={fmt(stats.revenue.yesterday)} muted />
          <Card label="Ventas semana" value={fmt(stats.revenue.week)} />
          <Card label="Ventas mes" value={fmt(stats.revenue.month)} accent />
        </div>

        {/* Order cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          <Card
            label="Órdenes hoy"
            value={stats.orders.today.toString()}
            delta={todayDeltaOrders}
          />
          <Card label="Órdenes mes" value={stats.orders.month.toString()} />
          <Card label="Ticket promedio (mes)" value={fmt(stats.averageTicket)} />
          <Card
            label="Producto más vendido"
            value={
              stats.topProductByUnits
                ? `${stats.topProductByUnits.brand} — ${stats.topProductByUnits.name}`
                : "—"
            }
            sub={
              stats.topProductByUnits ? `${stats.topProductByUnits.units} unidades` : undefined
            }
          />
        </div>

        {/* 30-day chart */}
        <section className="bg-white border border-gray-200 rounded mb-10">
          <header className="px-5 py-4 border-b border-gray-200">
            <h2 className="text-sm font-semibold text-gray-900">
              Últimos 30 días — ventas por día
            </h2>
          </header>
          <div className="p-2 sm:p-4">
            <table className="w-full text-sm">
              <tbody>
                {stats.daily.map((d) => {
                  const pct = (d.revenue / maxRevenue) * 100;
                  return (
                    <tr key={d.date} className="border-b last:border-b-0 border-gray-100">
                      <td className="py-2 pr-4 text-xs font-mono text-gray-500 whitespace-nowrap w-24">
                        {d.date}
                      </td>
                      <td className="py-2 pr-4 w-16 text-xs text-gray-700 text-right">
                        {d.orders}
                      </td>
                      <td className="py-2 pr-4 w-32 text-xs text-gray-900 text-right whitespace-nowrap tabular-nums">
                        {d.revenue > 0 ? fmt(d.revenue) : "—"}
                      </td>
                      <td className="py-2">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Top products + top cities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="bg-white border border-gray-200 rounded">
            <header className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Top 10 productos más vendidos
              </h2>
            </header>
            <ul className="divide-y divide-gray-100">
              {stats.topProducts.length === 0 ? (
                <li className="px-5 py-6 text-sm text-gray-500">Sin ventas aún.</li>
              ) : (
                stats.topProducts.map((p, i) => {
                  const imgUrl = p.imageKey ? resolveImageUrl(p.imageKey) : null;
                  return (
                    <li key={p.id} className="px-5 py-3 flex items-center gap-3">
                      <span className="w-5 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                      <div className="w-10 h-10 bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
                        {imgUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={imgUrl}
                            alt=""
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <span className="text-[8px] uppercase text-gray-400">
                            {p.brand.slice(0, 3)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-wider text-gray-500">
                          {p.brand}
                        </p>
                        <p className="text-sm text-gray-900 truncate">
                          <Link
                            href={`/p/${p.slug}`}
                            className="hover:text-blue-600"
                            target="_blank"
                          >
                            {p.name}
                          </Link>
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-gray-900 tabular-nums">
                        {p.units}u
                      </span>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="bg-white border border-gray-200 rounded">
            <header className="px-5 py-4 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-900">
                Top 10 ciudades por compras
              </h2>
            </header>
            <ul className="divide-y divide-gray-100">
              {stats.topCities.length === 0 ? (
                <li className="px-5 py-6 text-sm text-gray-500">Sin datos aún.</li>
              ) : (
                stats.topCities.map((c, i) => (
                  <li key={c.city} className="px-5 py-3 flex items-center gap-3">
                    <span className="w-5 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 truncate">{c.city || "—"}</p>
                      <p className="text-xs text-gray-500">
                        {c.orders} {c.orders === 1 ? "orden" : "órdenes"}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 tabular-nums">
                      {fmt(c.revenue)}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  delta,
  accent = false,
  muted = false,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: number | null;
  accent?: boolean;
  muted?: boolean;
}) {
  const valueClass = accent
    ? "text-emerald-700"
    : muted
      ? "text-gray-600"
      : "text-gray-900";
  return (
    <div className="bg-white border border-gray-200 px-4 py-4 rounded">
      <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 mb-1.5">
        {label}
      </p>
      <p className={`text-xl font-semibold ${valueClass} truncate`} title={value}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
      {typeof delta === "number" && (
        <p
          className={`text-xs mt-1 ${
            delta >= 0 ? "text-emerald-600" : "text-red-600"
          }`}
        >
          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(0)}% vs ayer
        </p>
      )}
    </div>
  );
}
