/**
 * Extract perfume catalog from Disfragancias (Shopify store).
 * Uses products.json API - no Playwright. Generates datasets only.
 */
import * as fs from "fs";
import * as path from "path";

const BASE = "https://disfragancias.com";
const LIMIT = 250;

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  vendor: string;
  product_type: string;
  tags: string[];
  images: { src: string; alt: string | null }[];
  variants: {
    price: string;
    available: boolean;
    featured_image?: { src: string };
  }[];
}

interface ExtractedProduct {
  name: string;
  brand: string;
  brand_slug: string;
  product_slug: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  notes_top: string[];
  notes_middle: string[];
  notes_base: string[];
  image_url: string;
  source: string;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractNotesFromBody(body: string): {
  top: string[];
  middle: string[];
  base: string[];
} {
  const top: string[] = [];
  const middle: string[] = [];
  const base: string[] = [];
  const clean = body.replace(/<[^>]+>/g, " ");
  const parseNotes = (s: string) =>
    s
      .split(/[,;y]/)
      .map((x) => x.replace(/\([^)]*\)/g, "").trim())
      .filter((x) => x.length > 1);
  const topMatch = clean.match(/notas?\s+de\s+salida[:\s]+([^;.]+?)(?=\.|notas?|coraz[oó]n|$)/i);
  const midMatch = clean.match(/notas?\s+de\s+coraz[oó]n[:\s]+([^;.]+?)(?=\.|notas?|base|$)/i);
  const baseMatch = clean.match(/notas?\s+de\s+base[:\s]+([^;.]+?)(?=\.|notas?|$)/i);
  if (topMatch) top.push(...parseNotes(topMatch[1]!));
  if (midMatch) middle.push(...parseNotes(midMatch[1]!));
  if (baseMatch) base.push(...parseNotes(baseMatch[1]!));
  return { top, middle, base };
}

function inferCategory(tags: string[], productType: string): string {
  const catMap: Record<string, string> = {
    arabe: "arabes",
    arabes: "arabes",
    "de nicho": "nicho",
    nicho: "nicho",
    diseñador: "disenador",
    citrico: "citricos",
    citricos: "citricos",
    dulce: "dulces",
    dulces: "dulces",
    fresco: "frescos",
    frescos: "frescos",
    floral: "florales",
    florales: "florales",
    frutal: "frutales",
    frutales: "frutales",
    amaderado: "amaderados",
    amaderados: "amaderados",
    decants: "decants",
  };
  const tagLower = tags.map((t) => t.toLowerCase().trim());
  for (const [key, val] of Object.entries(catMap)) {
    if (tagLower.some((t) => t.includes(key))) return val;
  }
  if (productType) return productType.toLowerCase();
  return "";
}

async function fetchPage(page: number): Promise<ShopifyProduct[]> {
  const url = `${BASE}/products.json?limit=${LIMIT}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const json = (await res.json()) as { products: ShopifyProduct[] };
  return json.products || [];
}

function extractProduct(p: ShopifyProduct): ExtractedProduct {
  const brand = p.vendor || "Unknown";
  const name = p.title;
  const brandSlug = slugify(brand);
  const productSlug = slugify(p.handle || name);
  const fullSlug = `${brandSlug}-${productSlug}`;

  const minPrice = p.variants?.length
    ? Math.min(
        ...p.variants.map((v) => parseFloat(v.price) || 0).filter((n) => n > 0)
      )
    : 0;
  const price = minPrice || 0;

  const img =
    p.images?.[0]?.src ||
    p.variants?.[0]?.featured_image?.src ||
    "";

  const desc = stripHtml(p.body_html || "").slice(0, 500);
  const notes = extractNotesFromBody(p.body_html || "");
  const category = inferCategory(p.tags || [], p.product_type || "");

  return {
    name,
    brand,
    brand_slug: brandSlug,
    product_slug: productSlug,
    slug: fullSlug,
    category,
    price: Math.round(price),
    description: desc,
    notes_top: notes.top,
    notes_middle: notes.middle,
    notes_base: notes.base,
    image_url: img,
    source: "disfragancias",
  };
}

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const allProducts: ExtractedProduct[] = [];
  let page = 1;
  let hasMore = true;

  console.log("Fetching products from Disfragancias...");
  while (hasMore) {
    const products = await fetchPage(page);
    if (products.length === 0) break;
    for (const p of products) {
      allProducts.push(extractProduct(p));
    }
    console.log(`  Page ${page}: ${products.length} products`);
    if (products.length < LIMIT) hasMore = false;
    else {
      page++;
      await new Promise((r) => setTimeout(r, 400)); // Rate limit
    }
  }

  // Deduplicate by slug (keep first)
  const seen = new Set<string>();
  const unique: ExtractedProduct[] = [];
  const duplicates: { slug: string; name: string; brand: string }[] = [];

  for (const p of allProducts) {
    if (seen.has(p.slug)) {
      duplicates.push({ slug: p.slug, name: p.name, brand: p.brand });
      continue;
    }
    seen.add(p.slug);
    unique.push(p);
  }

  // Missing fields report
  const missingFields = {
    name: 0,
    brand: 0,
    price: 0,
    description: 0,
    image_url: 0,
    category: 0,
  };
  const categoriesDetected = new Set<string>();
  for (const p of unique) {
    if (!p.name) missingFields.name++;
    if (!p.brand) missingFields.brand++;
    if (!p.price) missingFields.price++;
    if (!p.description) missingFields.description++;
    if (!p.image_url) missingFields.image_url++;
    if (!p.category) missingFields.category++;
    if (p.category) categoriesDetected.add(p.category);
  }

  // Write JSON
  const jsonPath = path.join(dataDir, "disfragancias_products.json");
  fs.writeFileSync(jsonPath, JSON.stringify(unique, null, 2), "utf-8");
  console.log(`Wrote ${unique.length} products to ${jsonPath}`);

  // Write CSV
  const csvPath = path.join(dataDir, "disfragancias_products.csv");
  const csvRows = unique.map((p) => ({
    brand: p.brand,
    name: p.name,
    slug: p.slug,
    category: p.category,
    price: p.price,
    stock: 0,
    image_url: p.image_url,
    source: p.source,
  }));
  const csvHeader = "brand,name,slug,category,price,stock,image_url,source\n";
  const csvBody = csvRows
    .map((r) =>
      [
        `"${(r.brand || "").replace(/"/g, '""')}"`,
        `"${(r.name || "").replace(/"/g, '""')}"`,
        r.slug,
        r.category,
        r.price,
        r.stock,
        `"${(r.image_url || "").replace(/"/g, '""')}"`,
        r.source,
      ].join(",")
    )
    .join("\n");
  fs.writeFileSync(csvPath, csvHeader + csvBody, "utf-8");
  console.log(`Wrote CSV to ${csvPath}`);

  // Write duplicates
  const dupPath = path.join(dataDir, "disfragancias_duplicates.csv");
  const dupHeader = "slug,name,brand\n";
  const dupBody = duplicates
    .map((d) => `"${d.slug}","${(d.name || "").replace(/"/g, '""')}","${(d.brand || "").replace(/"/g, '""')}"`)
    .join("\n");
  fs.writeFileSync(dupPath, dupHeader + dupBody, "utf-8");
  console.log(`Wrote ${duplicates.length} duplicates to ${dupPath}`);

  // Write report
  const report = {
    products_found: allProducts.length,
    duplicates_removed: duplicates.length,
    unique_products: unique.length,
    missing_fields: missingFields,
    categories_detected: Array.from(categoriesDetected).sort(),
  };
  const reportPath = path.join(dataDir, "disfragancias_scrape_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");
  console.log(`Wrote report to ${reportPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
