import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callAI, stripJsonFence } from "@/lib/ai";
import { resolveImageUrl } from "@/lib/image-url";
import type { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface QuizAnswers {
  style: string; // misterioso | fresco | elegante | atrevido
  moment: string; // dia | noche | aventura | romance
  ambience: string; // biblioteca | bosque | jardin | playa | zoco
  intensity: number; // 1-10
  target: string; // hombre | mujer | regalo-hombre | regalo-mujer | sin-definir
  budget: string; // <200 | 200-400 | >400 | sin-limite
}

interface ClaudeQuizResponse {
  olfactoryProfile: string;
  profileDescription: string;
  recommendations: Array<{
    slug: string;
    matchScore: number;
    personalizedReason: string;
  }>;
}

function budgetToRange(budget: string): { min?: number; max?: number } {
  switch (budget) {
    case "<200":
      return { max: 200000 };
    case "200-400":
      return { min: 200000, max: 400000 };
    case ">400":
      return { min: 400000 };
    default:
      return {};
  }
}

function genderFilter(target: string): string | null {
  switch (target) {
    case "hombre":
    case "regalo-hombre":
      return "masculine";
    case "mujer":
    case "regalo-mujer":
      return "feminine";
    default:
      return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { answers?: QuizAnswers };
    const a = body.answers;
    if (!a) {
      return NextResponse.json({ error: "Respuestas incompletas." }, { status: 400 });
    }

    const range = budgetToRange(a.budget);
    const genderPref = genderFilter(a.target);

    // Narrow catalog by budget + gender (if specified)
    const where: Prisma.ProductWhereInput = { images: { some: {} } };
    if (range.min != null || range.max != null) {
      where.price = {};
      if (range.min != null) where.price.gte = range.min;
      if (range.max != null) where.price.lte = range.max;
    }
    if (genderPref) {
      // allow unisex + specific gender
      where.OR = [{ gender: genderPref }, { gender: "unisex" }, { gender: null }];
    }

    const products = await prisma.product.findMany({
      where,
      select: {
        slug: true,
        name: true,
        brand: true,
        price: true,
        tags: true,
        gender: true,
        family: true,
      },
      take: 150,
    });

    if (products.length === 0) {
      return NextResponse.json(
        {
          error: "No encontramos fragancias que coincidan con tu presupuesto y preferencias.",
        },
        { status: 404 },
      );
    }

    const compact = products.map((p) => ({
      slug: p.slug,
      brand: p.brand,
      name: p.name,
      price: p.price,
      family: p.family || "",
      gender: p.gender || "",
      tags: p.tags,
    }));

    const system =
      "Eres un experto en perfumería y psicología olfativa. " +
      "Tu tarea es recomendar 3 fragancias personalizadas basadas en un quiz de personalidad. " +
      "Responde SOLO en JSON válido, sin markdown ni explicaciones extra. " +
      "Escribe en español colombiano cercano, como si aconsejaras a un amigo.";

    const userPrompt =
      `Respuestas del quiz:\n` +
      `- Estilo personal: ${a.style}\n` +
      `- Momento de uso: ${a.moment}\n` +
      `- Ambiente inspirador: ${a.ambience}\n` +
      `- Intensidad preferida (1-10): ${a.intensity}\n` +
      `- Para quién: ${a.target}\n` +
      `- Presupuesto: ${a.budget}\n\n` +
      `Catálogo disponible (${compact.length} productos):\n` +
      JSON.stringify(compact) +
      `\n\nDevuelve un JSON con esta estructura exacta:\n` +
      `{\n` +
      `  "olfactoryProfile": "Ej: Oriental Intenso",\n` +
      `  "profileDescription": "Descripción de 2 frases sobre su personalidad olfativa.",\n` +
      `  "recommendations": [\n` +
      `    { "slug": "slug-exacto-del-catalogo", "matchScore": 94, "personalizedReason": "Una frase personalizada de por qué esta fragancia es para ti" }\n` +
      `  ]\n` +
      `}\n\n` +
      `Reglas:\n` +
      `- Recomienda EXACTAMENTE 3 fragancias del catálogo dado.\n` +
      `- La primera es el match perfecto (matchScore 88-96).\n` +
      `- Las otras 2 son alternativas (matchScore 75-87).\n` +
      `- slug debe existir en el catálogo.\n` +
      `- personalizedReason en segunda persona "tú", máximo 140 caracteres.`;

    let aiText: string;
    try {
      aiText = await callAI({
        system,
        user: userPrompt,
        maxTokens: 1200,
        jsonMode: true,
      });
    } catch (err) {
      console.error("[quiz] OpenAI error:", err);
      return NextResponse.json(
        { error: "No pudimos procesar tu quiz. Intenta de nuevo." },
        { status: 502 },
      );
    }

    let parsed: ClaudeQuizResponse;
    try {
      parsed = JSON.parse(stripJsonFence(aiText)) as ClaudeQuizResponse;
    } catch {
      console.error("[quiz] Invalid JSON:", aiText.slice(0, 500));
      return NextResponse.json(
        { error: "La respuesta no se pudo interpretar." },
        { status: 502 },
      );
    }

    const enriched = await Promise.all(
      (parsed.recommendations || []).slice(0, 3).map(async (r) => {
        const p = await prisma.product.findUnique({
          where: { slug: r.slug },
          include: { images: { orderBy: { position: "asc" }, take: 1 } },
        });
        if (!p) return null;
        const imgKey = p.images[0]?.key;
        return {
          id: p.id,
          slug: p.slug,
          name: p.name,
          brand: p.brand,
          price: p.price,
          compareAt: p.compareAt,
          imageUrl: imgKey ? resolveImageUrl(imgKey) : null,
          matchScore: Math.max(60, Math.min(99, r.matchScore)),
          personalizedReason: r.personalizedReason,
        };
      }),
    );

    const recommendations = enriched.filter(
      (x): x is NonNullable<typeof x> => x != null,
    );

    return NextResponse.json({
      olfactoryProfile: parsed.olfactoryProfile || "Perfil único",
      profileDescription: parsed.profileDescription || "",
      recommendations,
    });
  } catch (err) {
    console.error("[quiz] error:", err);
    return NextResponse.json(
      { error: "Error inesperado. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
