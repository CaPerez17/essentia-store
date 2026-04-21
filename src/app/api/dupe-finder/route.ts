import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { callAI, stripJsonFence } from "@/lib/ai";
import { resolveImageUrl } from "@/lib/image-url";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

interface ClaudeAlternative {
  slug: string;
  similarityScore: number;
  reason: string;
  matchingNotes?: string[];
}

interface ClaudeResponse {
  searched: string;
  searchedBrand?: string;
  searchedFamily?: string;
  searchedNotes?: string[];
  alternatives: ClaudeAlternative[];
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { perfume?: string };
    const perfume = (body.perfume || "").trim();
    if (perfume.length < 3) {
      return NextResponse.json(
        { error: "Asegúrate de escribir el nombre completo del perfume." },
        { status: 400 },
      );
    }

    // Pull a lean catalog
    const products = await prisma.product.findMany({
      where: { images: { some: {} } },
      select: {
        slug: true,
        name: true,
        brand: true,
        price: true,
        tags: true,
        gender: true,
        family: true,
      },
      take: 200,
    });

    // Build a compact representation for Claude
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
      "Eres un experto en perfumería con conocimiento enciclopédico de fragancias. " +
      "Tu tarea es encontrar las mejores alternativas en un catálogo dado para un perfume de diseñador que el cliente busca. " +
      "Responde SOLO en JSON válido, sin markdown, sin explicaciones extra. " +
      "Escribe en español colombiano.";

    const userPrompt =
      `El cliente busca alternativas a: "${perfume}"\n\n` +
      `Catálogo disponible (JSON, ${compact.length} productos):\n` +
      JSON.stringify(compact) +
      `\n\nDevuelve un JSON con esta estructura exacta:\n` +
      `{\n` +
      `  "searched": "nombre completo del perfume buscado",\n` +
      `  "searchedBrand": "marca original",\n` +
      `  "searchedFamily": "familia olfativa principal",\n` +
      `  "searchedNotes": ["nota1","nota2","nota3"],\n` +
      `  "alternatives": [\n` +
      `    { "slug": "slug-del-producto", "similarityScore": 87, "reason": "Una frase de por qué es similar", "matchingNotes": ["Bergamota","Cedro"] }\n` +
      `  ]\n` +
      `}\n\n` +
      `Reglas:\n` +
      `- Selecciona máximo 3 alternativas del catálogo dado.\n` +
      `- El slug debe existir exactamente en el catálogo.\n` +
      `- similarityScore entre 60 y 95.\n` +
      `- reason en español, máximo 120 caracteres, sin repetir el nombre.\n` +
      `- Si no reconoces el perfume buscado, inventa su familia/notas con tu conocimiento general.`;

    let aiText: string;
    try {
      aiText = await callAI({
        system,
        user: userPrompt,
        maxTokens: 1200,
        jsonMode: true,
      });
    } catch (err) {
      console.error("[dupe-finder] OpenAI error:", err);
      return NextResponse.json(
        { error: "No pudimos procesar la búsqueda. Intenta de nuevo." },
        { status: 502 },
      );
    }

    let parsed: ClaudeResponse;
    try {
      parsed = JSON.parse(stripJsonFence(aiText)) as ClaudeResponse;
    } catch {
      console.error("[dupe-finder] Invalid JSON:", aiText.slice(0, 500));
      return NextResponse.json(
        { error: "La respuesta no se pudo interpretar. Intenta con otro nombre." },
        { status: 502 },
      );
    }

    // Enrich alternatives with full product data + image URL
    const enriched = await Promise.all(
      (parsed.alternatives || []).slice(0, 3).map(async (a) => {
        const p = await prisma.product.findUnique({
          where: { slug: a.slug },
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
          similarityScore: Math.max(60, Math.min(95, a.similarityScore)),
          reason: a.reason,
          matchingNotes: a.matchingNotes || [],
        };
      }),
    );

    const alternatives = enriched.filter((x): x is NonNullable<typeof x> => x != null);

    return NextResponse.json({
      searched: parsed.searched || perfume,
      searchedBrand: parsed.searchedBrand || null,
      searchedFamily: parsed.searchedFamily || null,
      searchedNotes: parsed.searchedNotes || [],
      alternatives,
    });
  } catch (err) {
    console.error("[dupe-finder] error:", err);
    return NextResponse.json(
      { error: "Error inesperado. Intenta de nuevo." },
      { status: 500 },
    );
  }
}
