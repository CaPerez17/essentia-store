import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = ["PAID", "SHIPPED", "DELIVERED", "CANCELLED"] as const;

const bodySchema = z.object({
  status: z.enum(ALLOWED_STATUSES),
  trackingNumber: z.string().min(1).optional(),
});

function requireAdminKey(request: Request): boolean {
  const key = request.headers.get("x-admin-key");
  const expected = process.env.ADMIN_API_KEY;
  return !!expected && key === expected;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!requireAdminKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { status, trackingNumber } = parsed.data;

  const existing = await prisma.order.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Embed/replace tracking marker inside shippingNotes — schema has no
  // dedicated field, this keeps things round-trippable.
  let nextNotes = existing.shippingNotes ?? "";
  if (trackingNumber) {
    const stripped = nextNotes.replace(/\s*\[TRACKING:[^\]]+\]/g, "").trim();
    nextNotes = `${stripped}${stripped ? " " : ""}[TRACKING:${trackingNumber}]`.trim();
  }

  const updated = await prisma.order.update({
    where: { id },
    data: {
      status,
      ...(trackingNumber !== undefined ? { shippingNotes: nextNotes || null } : {}),
    },
  });

  console.log(
    `[admin/orders] order ${updated.code} → status=${status}${trackingNumber ? ` tracking=${trackingNumber}` : ""}`,
  );

  return NextResponse.json({ ok: true, order: updated });
}
