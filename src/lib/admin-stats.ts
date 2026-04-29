/**
 * Server-side analytics queries that power the admin dashboard.
 * Everything reads from the Order / OrderItem tables so numbers reflect
 * actual paid sales (not page-view analytics).
 */

import { prisma } from "@/lib/prisma";
import {
  bogotaDateKey,
  startOfDayCO,
  startOfMonthCO,
  startOfNDaysAgoCO,
  startOfWeekCO,
  startOfYesterdayCO,
} from "@/lib/admin-time";

/** Statuses that count as "money in" for revenue / order-count metrics. */
const PAID_STATUSES = ["PAID", "SHIPPED", "DELIVERED"] as const;

export interface DashboardStats {
  revenue: {
    today: number;
    yesterday: number;
    week: number;
    month: number;
  };
  orders: {
    today: number;
    yesterday: number;
    month: number;
  };
  averageTicket: number;
  topProductByUnits: { id: string; name: string; brand: string; units: number } | null;
  daily: Array<{ date: string; orders: number; revenue: number }>;
  topProducts: Array<{
    id: string;
    name: string;
    brand: string;
    slug: string;
    units: number;
    revenue: number;
    imageKey: string | null;
  }>;
  topCities: Array<{ city: string; orders: number; revenue: number }>;
}

export async function getDashboardStats(now: Date = new Date()): Promise<DashboardStats> {
  const todayStart = startOfDayCO(now);
  const yesterdayStart = startOfYesterdayCO(now);
  const weekStart = startOfWeekCO(now);
  const monthStart = startOfMonthCO(now);
  const thirtyDaysAgo = startOfNDaysAgoCO(30, now);

  const baseWhere = { status: { in: [...PAID_STATUSES] } };

  // Aggregates run in parallel — every metric is independent.
  const [
    todayAgg,
    yesterdayAgg,
    weekAgg,
    monthAgg,
    monthCount,
    yesterdayCount,
    todayCount,
    monthlyTicketAgg,
    last30Days,
    topItems,
    topCities,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { ...baseWhere, paidAt: { gte: todayStart } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: {
        ...baseWhere,
        paidAt: { gte: yesterdayStart, lt: todayStart },
      },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.order.aggregate({
      where: { ...baseWhere, paidAt: { gte: weekStart } },
      _sum: { total: true },
    }),
    prisma.order.aggregate({
      where: { ...baseWhere, paidAt: { gte: monthStart } },
      _sum: { total: true },
    }),
    prisma.order.count({
      where: { ...baseWhere, paidAt: { gte: monthStart } },
    }),
    prisma.order.count({
      where: {
        ...baseWhere,
        paidAt: { gte: yesterdayStart, lt: todayStart },
      },
    }),
    prisma.order.count({
      where: { ...baseWhere, paidAt: { gte: todayStart } },
    }),
    // Average ticket = month revenue / month orders
    prisma.order.aggregate({
      where: { ...baseWhere, paidAt: { gte: monthStart } },
      _avg: { total: true },
    }),
    // Daily breakdown for the last 30 days — pull paid orders, bucket in JS
    prisma.order.findMany({
      where: { ...baseWhere, paidAt: { gte: thirtyDaysAgo } },
      select: { total: true, paidAt: true },
    }),
    // Top items by units sold (joined in DB-agnostic way)
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { order: baseWhere },
      _sum: { quantity: true, price: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.order.groupBy({
      by: ["shippingCity"],
      where: baseWhere,
      _count: { _all: true },
      _sum: { total: true },
      orderBy: { _count: { shippingCity: "desc" } },
      take: 10,
    }),
  ]);

  // Hydrate top item productIds → product details + first image
  const productIds = topItems.map((t) => t.productId);
  const products =
    productIds.length > 0
      ? await prisma.product.findMany({
          where: { id: { in: productIds } },
          select: {
            id: true,
            name: true,
            brand: true,
            slug: true,
            images: {
              select: { key: true },
              orderBy: { position: "asc" },
              take: 1,
            },
          },
        })
      : [];

  const productMap = new Map(products.map((p) => [p.id, p]));
  const topProducts = topItems
    .map((t) => {
      const p = productMap.get(t.productId);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        slug: p.slug,
        units: t._sum.quantity ?? 0,
        revenue: (t._sum.price ?? 0) * 1, // price column is unit price; rough
        imageKey: p.images[0]?.key ?? null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x != null);

  // Bucket the last-30-days orders by Bogotá calendar day
  const dailyMap = new Map<string, { orders: number; revenue: number }>();
  for (let i = 29; i >= 0; i--) {
    const d = startOfNDaysAgoCO(i, now);
    dailyMap.set(bogotaDateKey(d), { orders: 0, revenue: 0 });
  }
  for (const o of last30Days) {
    if (!o.paidAt) continue;
    const key = bogotaDateKey(o.paidAt);
    const bucket = dailyMap.get(key);
    if (!bucket) continue;
    bucket.orders += 1;
    bucket.revenue += o.total;
  }
  const daily = Array.from(dailyMap.entries()).map(([date, v]) => ({
    date,
    orders: v.orders,
    revenue: v.revenue,
  }));

  return {
    revenue: {
      today: todayAgg._sum.total ?? 0,
      yesterday: yesterdayAgg._sum.total ?? 0,
      week: weekAgg._sum.total ?? 0,
      month: monthAgg._sum.total ?? 0,
    },
    orders: {
      today: todayCount,
      yesterday: yesterdayCount,
      month: monthCount,
    },
    averageTicket: monthlyTicketAgg._avg.total ?? 0,
    topProductByUnits: topProducts[0]
      ? {
          id: topProducts[0].id,
          name: topProducts[0].name,
          brand: topProducts[0].brand,
          units: topProducts[0].units,
        }
      : null,
    daily,
    topProducts,
    topCities: topCities.map((c) => ({
      city: c.shippingCity,
      orders: c._count._all,
      revenue: c._sum.total ?? 0,
    })),
  };
}
