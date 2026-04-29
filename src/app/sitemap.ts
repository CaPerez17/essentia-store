import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { brandSlug } from "@/lib/brands";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://www.essentiaperfumes.co";

/** Cities we ship priority SEO landing pages to — kept in sync with /perfumes/[ciudad]. */
const SEO_CITIES = [
  "bogota",
  "medellin",
  "cali",
  "barranquilla",
  "cartagena",
  "bucaramanga",
  "cucuta",
  "manizales",
  "pereira",
  "santa-marta",
  "monteria",
  "valledupar",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Pull products and brand list in parallel — both feed the sitemap.
  const [products, brandStats] = await Promise.all([
    prisma.product.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.groupBy({ by: ["brand"], _count: { brand: true } }),
  ]);

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${BASE_URL}/p/${p.slug}`,
    lastModified: p.updatedAt,
    changeFrequency: "daily",
    priority: 0.9,
  }));

  const brandUrls: MetadataRoute.Sitemap = brandStats.map((b) => ({
    url: `${BASE_URL}/marcas/${brandSlug(b.brand)}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const cityUrls: MetadataRoute.Sitemap = SEO_CITIES.map((city) => ({
    url: `${BASE_URL}/perfumes/${city}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/catalogo`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${BASE_URL}/marcas`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/dupe-finder`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/quiz`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: `${BASE_URL}/novedades`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
  ];

  return [...staticUrls, ...brandUrls, ...cityUrls, ...productUrls];
}
