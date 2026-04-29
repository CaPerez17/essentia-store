/**
 * Bogotá-timezone (UTC-5, no DST) date helpers shared by the admin dashboard
 * and orders pages. Every revenue/orders metric reads from these so "today"
 * lines up with the merchant's local day, not UTC.
 */

const BOGOTA_OFFSET_MS = 5 * 60 * 60 * 1000; // UTC-5

/** Start of today in Bogotá, returned as a UTC `Date`. */
export function startOfDayCO(now: Date = new Date()): Date {
  const bogota = new Date(now.getTime() - BOGOTA_OFFSET_MS);
  bogota.setUTCHours(0, 0, 0, 0);
  return new Date(bogota.getTime() + BOGOTA_OFFSET_MS);
}

/** Start of yesterday in Bogotá. */
export function startOfYesterdayCO(now: Date = new Date()): Date {
  const today = startOfDayCO(now);
  return new Date(today.getTime() - 24 * 60 * 60 * 1000);
}

/** Start of the current week (Monday 00:00 Bogotá). */
export function startOfWeekCO(now: Date = new Date()): Date {
  const today = startOfDayCO(now);
  const bg = new Date(today.getTime() - BOGOTA_OFFSET_MS);
  // getUTCDay: 0 = Sunday … 6 = Saturday. Treat Monday as week start.
  const dayOfWeek = bg.getUTCDay();
  const offsetToMonday = (dayOfWeek + 6) % 7;
  bg.setUTCDate(bg.getUTCDate() - offsetToMonday);
  return new Date(bg.getTime() + BOGOTA_OFFSET_MS);
}

/** Start of the current month (1st 00:00 Bogotá). */
export function startOfMonthCO(now: Date = new Date()): Date {
  const today = startOfDayCO(now);
  const bg = new Date(today.getTime() - BOGOTA_OFFSET_MS);
  bg.setUTCDate(1);
  return new Date(bg.getTime() + BOGOTA_OFFSET_MS);
}

/** N days ago at 00:00 Bogotá. */
export function startOfNDaysAgoCO(n: number, now: Date = new Date()): Date {
  const today = startOfDayCO(now);
  return new Date(today.getTime() - n * 24 * 60 * 60 * 1000);
}

/** Format a UTC Date as YYYY-MM-DD using the Bogotá calendar day. */
export function bogotaDateKey(d: Date): string {
  const bg = new Date(d.getTime() - BOGOTA_OFFSET_MS);
  const y = bg.getUTCFullYear();
  const m = String(bg.getUTCMonth() + 1).padStart(2, "0");
  const day = String(bg.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
