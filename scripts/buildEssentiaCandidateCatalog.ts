/**
 * Build Essentia candidate catalog from matched_catalog.csv.
 * Output: data/essentia_catalog_candidate.csv
 * Does NOT include unmatched products.
 */
import * as fs from "fs";
import * as path from "path";

interface MatchedRow {
  brand: string;
  brand_slug: string;
  display_name: string;
  product_slug: string;
  local_image_key: string;
  external_name: string;
  external_slug: string;
  confidence: number;
  category: string;
  price_reference: number;
  description: string;
  image_url_external: string;
  source: string;
}

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.trim().split("\n");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]!);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]!);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] ?? "";
    });
    rows.push(row);
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

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const matchedPath = path.join(dataDir, "matched_catalog.csv");

  if (!fs.existsSync(matchedPath)) {
    console.error("Run catalog:match first. Missing:", matchedPath);
    process.exit(1);
  }

  const content = fs.readFileSync(matchedPath, "utf-8");
  const rows = parseCsv(content) as unknown as MatchedRow[];

  const candidates = rows.map((r) => ({
    name: r.display_name || r.external_name,
    slug: `${r.brand_slug}-${r.product_slug}`,
    brand: r.brand,
    category: r.category || "",
    gender: "",
    price: r.price_reference || 0,
    stock: 0,
    description: r.description || "",
    imageKey: r.local_image_key,
    source: "local-assets+disfragancias",
    externalName: r.external_name || "",
    confidence: r.confidence,
  }));

  const outPath = path.join(dataDir, "essentia_catalog_candidate.csv");
  const header =
    "name,slug,brand,category,gender,price,stock,description,imageKey,source,externalName,confidence\n";
  const body = candidates
    .map((r) =>
      [
        `"${(r.name || "").replace(/"/g, '""')}"`,
        r.slug,
        `"${(r.brand || "").replace(/"/g, '""')}"`,
        r.category,
        r.gender,
        r.price,
        r.stock,
        `"${(r.description || "").replace(/"/g, '""').slice(0, 500)}"`,
        r.imageKey,
        r.source,
        `"${(r.externalName || "").replace(/"/g, '""')}"`,
        r.confidence,
      ].join(",")
    )
    .join("\n");
  fs.writeFileSync(outPath, header + body, "utf-8");

  console.log(`Wrote ${candidates.length} candidates to ${outPath}`);
}

main();
