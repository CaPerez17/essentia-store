import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface CsvRow {
  slug: string;
  name: string;
  brand: string;
  description: string;
  price: string;
  compareAt: string;
  stock: string;
  family: string;
  occasion: string;
  intensity: string;
  gender: string;
  tags: string;
  featured: string;
  isNew: string;
  onSale: string;
  imageKeys: string;
}

function parseCsv(content: string): CsvRow[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row as unknown as CsvRow);
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
    } else if ((c === "," && !inQuotes) || c === "\n" || c === "\r") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

async function main() {
  const csvPath = path.join(process.cwd(), "data", "products.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("data/products.csv not found");
    process.exit(1);
  }
  const content = fs.readFileSync(csvPath, "utf-8");
  const rows = parseCsv(content);
  if (rows.length === 0) {
    console.log("No rows to import");
    return;
  }

  for (const row of rows) {
    const price = parseFloat(row.price) || 0;
    const compareAt = row.compareAt ? parseFloat(row.compareAt) : null;
    const stock = parseInt(row.stock, 10) || 0;
    const featured = /^(true|1|yes)$/i.test(row.featured);
    const isNew = /^(true|1|yes)$/i.test(row.isNew);
    const onSale = /^(true|1|yes)$/i.test(row.onSale);

    const imageKeys = row.imageKeys
      ? row.imageKeys
          .split(";")
          .map((k) => k.trim())
          .filter(Boolean)
      : [];

    await prisma.$transaction(async (tx) => {
      const product = await tx.product.upsert({
        where: { slug: row.slug },
        update: {
          name: row.name,
          brand: row.brand,
          description: row.description || null,
          price,
          compareAt,
          stock,
          family: row.family || null,
          occasion: row.occasion || null,
          intensity: row.intensity || null,
          gender: row.gender || null,
          tags: row.tags || "[]",
          featured,
          isNew,
          onSale,
        },
        create: {
          slug: row.slug,
          name: row.name,
          brand: row.brand,
          description: row.description || null,
          price,
          compareAt,
          stock,
          family: row.family || null,
          occasion: row.occasion || null,
          intensity: row.intensity || null,
          gender: row.gender || null,
          tags: row.tags || "[]",
          featured,
          isNew,
          onSale,
        },
      });

      await tx.productImage.deleteMany({ where: { productId: product.id } });
      if (imageKeys.length > 0) {
        await tx.productImage.createMany({
          data: imageKeys.map((key, idx) => ({
            productId: product.id,
            key,
            alt: null,
            position: idx,
          })),
        });
      }
    });

    console.log(`Upserted: ${row.slug}`);
  }

  console.log(`Done. Imported ${rows.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
