import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import { uploadToS3 } from "../src/lib/s3";

const prisma = new PrismaClient();

const CONCURRENCY = 5;
const FETCH_TIMEOUT_MS = 10_000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parseLegacyImages(raw: string | null): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();

  // JSON array
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed) as unknown;
      if (Array.isArray(arr)) return arr.filter((x): x is string => typeof x === "string" && x.length > 0);
    } catch {
      /* fall through */
    }
  }

  // Single URL
  if (trimmed.startsWith("http")) return [trimmed];

  return [];
}

async function fetchWithTimeout(url: string): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Products that have NO ProductImage rows yet
  const products = await prisma.product.findMany({
    where: { images: { none: {} } },
    orderBy: { brand: "asc" },
  });

  console.log(`\nFound ${products.length} products without S3 images\n`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < products.length; i += CONCURRENCY) {
    const chunk = products.slice(i, i + CONCURRENCY);
    await Promise.all(chunk.map(async (product) => {
      const urls = parseLegacyImages(product.imagesLegacy);

      if (urls.length === 0) {
        console.log(`— ${product.brand} - ${product.name}: sin imágenes`);
        skipped++;
        return;
      }

      try {
        const imageRecords: { key: string; alt: string; position: number }[] = [];

        for (let pos = 0; pos < urls.length; pos++) {
          const url = urls[pos]!;
          const raw = await fetchWithTimeout(url);
          const webp = await sharp(raw).webp({ quality: 82 }).toBuffer();
          const key = `products/${product.slug}/${pos}.webp`;
          await uploadToS3(webp, key);
          imageRecords.push({
            key,
            alt: `${product.brand} ${product.name}`,
            position: pos,
          });
        }

        // Persist all images in one transaction
        await prisma.productImage.createMany({
          data: imageRecords.map((img) => ({
            productId: product.id,
            key: img.key,
            alt: img.alt,
            position: img.position,
          })),
        });

        console.log(`✓ ${product.brand} - ${product.name} (${imageRecords.length} imágenes)`);
        ok++;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`✗ ${product.brand} - ${product.name}: ${msg}`);
        failed++;
      }
    }));
  }

  console.log(`\n=== Resumen ===`);
  console.log(`Total:    ${products.length}`);
  console.log(`Exitosos: ${ok}`);
  console.log(`Skipped:  ${skipped}`);
  console.log(`Fallidos: ${failed}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
