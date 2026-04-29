import { NextResponse } from "next/server";
import { getDashboardStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

/**
 * Admin dashboard JSON API. Same payload that powers /admin/dashboard.
 *
 * Auth: x-admin-key header OR ?key= query param. The query param exists for
 * one-off curl debugging; production callers should use the header.
 */
export async function GET(req: Request) {
  const adminKey = process.env.ADMIN_API_KEY;
  if (!adminKey) {
    return NextResponse.json(
      { error: "ADMIN_API_KEY not configured" },
      { status: 503 },
    );
  }

  const headerKey = req.headers.get("x-admin-key");
  const url = new URL(req.url);
  const queryKey = url.searchParams.get("key");
  const provided = headerKey || queryKey;

  if (provided !== adminKey) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const stats = await getDashboardStats();
    return NextResponse.json(stats, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (err) {
    console.error("[api/admin/dashboard] failed:", err);
    return NextResponse.json({ error: "server error" }, { status: 500 });
  }
}
