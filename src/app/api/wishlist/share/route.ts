import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

const shareSchema = z.object({
  productIds: z.array(z.string().min(1)).min(1, "La wishlist está vacía"),
});

function generateToken(): string {
  return randomBytes(16).toString("hex");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = shareSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "La wishlist está vacía" },
        { status: 400 }
      );
    }

    const { productIds } = parsed.data;
    let token = generateToken();
    let exists = await prisma.wishlistShare.findUnique({ where: { token } });
    while (exists) {
      token = generateToken();
      exists = await prisma.wishlistShare.findUnique({ where: { token } });
    }

    await prisma.wishlistShare.create({
      data: {
        token,
        productIds: JSON.stringify(productIds),
      },
    });

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const shareUrl = `${baseUrl}/wishlist/compartido/${token}`;

    return NextResponse.json({ token, url: shareUrl });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Error al crear enlace" },
      { status: 500 }
    );
  }
}
