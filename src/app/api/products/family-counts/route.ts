import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const FAMILY_KEYS = ["oriental", "amaderado", "floral", "fresco", "gourmand"];

// Additional tag keywords to boost matching beyond strict family column
const FAMILY_TAG_SYNONYMS: Record<string, string[]> = {
  oriental: ["oriental", "amber", "ambar", "oud", "incense"],
  amaderado: ["amaderado", "woody", "wood", "cedar", "sandal"],
  floral: ["floral", "rose", "jasmine", "flower"],
  fresco: ["fresco", "fresh", "citric", "citrico", "acuatico", "aquatic", "marine"],
  gourmand: ["gourmand", "sweet", "dulce", "vanilla", "vainilla", "chocolate"],
};

export async function GET() {
  try {
    const counts: Record<string, number> = {};

    for (const key of FAMILY_KEYS) {
      const synonyms = FAMILY_TAG_SYNONYMS[key] || [key];
      const orClause = [
        { family: { equals: key, mode: "insensitive" as const } },
        ...synonyms.map((s) => ({
          tags: { contains: s, mode: "insensitive" as const },
        })),
      ];
      counts[key] = await prisma.product.count({
        where: {
          images: { some: {} },
          OR: orClause,
        },
      });
    }

    return NextResponse.json({ counts });
  } catch (err) {
    console.error("[family-counts]", err);
    return NextResponse.json({ error: "Error" }, { status: 500 });
  }
}
