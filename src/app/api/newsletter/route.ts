import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email("Email inválido"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Email inválido" },
        { status: 400 },
      );
    }

    // For now: just log. In production, hook up to Resend audience, ConvertKit, Mailchimp, etc.
    console.log("[newsletter] Subscription:", parsed.data.email, "at", new Date().toISOString());

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[newsletter] error:", err);
    return NextResponse.json({ error: "Error procesando la suscripción" }, { status: 500 });
  }
}
