/**
 * Import products extracted from PDF into the database.
 * Reads data/essentia_from_pdf.csv + data/essentia_images/{slug}.jpg
 * Uploads images to S3 as webp, upserts Product + ProductImage in DB.
 *
 * Idempotent: can be run multiple times safely.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import sharp from "sharp";
import * as fs from "fs";
import * as path from "path";
import { uploadToS3 } from "../src/lib/s3";

const prisma = new PrismaClient();
const CONCURRENCY = 5;

// ---------------------------------------------------------------------------
// CSV parser
// ---------------------------------------------------------------------------

interface PdfProductRow {
  slug: string;
  brand: string;
  name: string;
  volume: string;
  gender: string;
  price: string;
  has_image: string;
  page: string;
}

function parseCsv(content: string): PdfProductRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  const rows: PdfProductRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row as unknown as PdfProductRow);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const dataDir = path.join(process.cwd(), "data");
  const csvPath = path.join(dataDir, "essentia_from_pdf.csv");
  const imagesDir = path.join(dataDir, "essentia_images");

  if (!fs.existsSync(csvPath)) {
    console.error(`Missing: ${csvPath}\nRun extract:pdf first.`);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(csvPath, "utf-8"));
  console.log(`\nLoaded ${rows.length} products from CSV\n`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.all(
      chunk.map(async (row) => {
        try {
          const price = parseFloat(row.price) || 0;
          if (price <= 0) {
            console.log(`— ${row.brand} - ${row.name}: precio inválido (${row.price})`);
            errors++;
            return;
          }

          // Build description with volume info
          const descParts: string[] = [];
          if (row.volume) descParts.push(`Presentación: ${row.volume}`);
          const description = descParts.length > 0 ? descParts.join(". ") : null;

          // Build tags from volume + gender
          const tags: string[] = [];
          if (row.volume) tags.push(row.volume);
          if (row.gender) tags.push(row.gender);

          // Upsert product — fields match prisma/schema.prisma Product model exactly
          const existing = await prisma.product.findUnique({
            where: { slug: row.slug },
          });

          const productData = {
            name: row.name,
            brand: row.brand,
            description,
            price,
            stock: 0,
            gender: row.gender || null,
            tags: JSON.stringify(tags),
            isNew: true,
          };

          let product;
          if (existing) {
            product = await prisma.product.update({
              where: { slug: row.slug },
              data: productData,
            });
            updated++;
          } else {
            product = await prisma.product.create({
              data: {
                slug: row.slug,
                ...productData,
              },
            });
            created++;
          }

          // Upload image to S3 if available
          if (row.has_image === "True" || row.has_image === "true") {
            const localImg = path.join(imagesDir, `${row.slug}.jpg`);
            if (fs.existsSync(localImg)) {
              const raw = fs.readFileSync(localImg);
              const webp = await sharp(raw)
                .resize(800, 800, { fit: "inside", withoutEnlargement: true })
                .webp({ quality: 85 })
                .toBuffer();

              const s3Key = `products/${row.slug}/01.webp`;
              await uploadToS3(webp, s3Key);

              // Create ProductImage if not exists
              const existingImage = await prisma.productImage.findFirst({
                where: { productId: product.id, key: s3Key },
              });

              if (!existingImage) {
                await prisma.productImage.create({
                  data: {
                    productId: product.id,
                    key: s3Key,
                    alt: `${row.brand} ${row.name}`,
                    position: 0,
                  },
                });
              }
            }
          }

          const action = existing ? "updated" : "created";
          const imgTag = row.has_image === "True" || row.has_image === "true" ? " + img" : "";
          console.log(`✓ ${row.brand} - ${row.name} (${action}${imgTag})`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          console.error(`✗ ${row.brand} - ${row.name}: ${msg}`);
          errors++;
        }
      }),
    );
  }

  console.log(`\n=== Resumen ===`);
  console.log(`Total:       ${rows.length}`);
  console.log(`Creados:     ${created}`);
  console.log(`Actualizados: ${updated}`);
  console.log(`Errores:     ${errors}\n`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
