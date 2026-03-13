/**
 * Match local asset catalog against Disfragancias extracted catalog.
 * Fuzzy match by brand + product name. Output: matched_catalog.csv, unmatched_local_products.csv, match_report.json
 */
import * as fs from "fs";
import * as path from "path";

const CONFIDENCE_THRESHOLD = 0.4;

interface LocalRow {
  brand: string;
  brand_slug: string;
  raw_name: string;
  display_name: string;
  product_slug: string;
  local_image_key: string;
  source: string;
}

interface DisfraganciasProduct {
  name: string;
  brand: string;
  brand_slug: string;
  product_slug: string;
  slug: string;
  category: string;
  price: number;
  description: string;
  image_url: string;
  source: string;
}

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

function normalizeForMatch(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function tokenize(s: string): Set<string> {
  return new Set(normalizeForMatch(s).split(/\s+/).filter((t) => t.length > 1));
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? inter / union : 0;
}

function brandSimilarity(localBrand: string, extBrand: string): number {
  const la = normalizeForMatch(localBrand);
  const lb = normalizeForMatch(extBrand);
  if (la === lb) return 1;
  if (la.includes(lb) || lb.includes(la)) return 0.9;
  const ta = tokenize(localBrand);
  const tb = tokenize(extBrand);
  return jaccard(ta, tb);
}

function productSimilarity(localName: string, extName: string): number {
  const ta = tokenize(localName);
  const tb = tokenize(extName);
  const j = jaccard(ta, tb);
  if (j > 0) return j;
  const la = normalizeForMatch(localName);
  const lb = normalizeForMatch(extName);
  if (la.includes(lb) || lb.includes(la)) return 0.7;
  return 0;
}

function computeConfidence(
  local: LocalRow,
  ext: DisfraganciasProduct
): number {
  const brandScore = brandSimilarity(local.brand, ext.brand);
  const productScore = productSimilarity(
    local.display_name || local.raw_name,
    ext.name
  );
  return 0.4 * brandScore + 0.6 * productScore;
}

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const localPath = path.join(dataDir, "local_assets_catalog.csv");
  const disfraPath = path.join(dataDir, "disfragancias_products.json");

  if (!fs.existsSync(localPath)) {
    console.error("Run catalog:local first. Missing:", localPath);
    process.exit(1);
  }
  if (!fs.existsSync(disfraPath)) {
    console.error("Run extract:disfragancias first. Missing:", disfraPath);
    process.exit(1);
  }

  const localCsv = fs.readFileSync(localPath, "utf-8");
  const localRows = parseCsv(localCsv) as unknown as LocalRow[];
  const disfraProducts = JSON.parse(
    fs.readFileSync(disfraPath, "utf-8")
  ) as DisfraganciasProduct[];

  const matched: MatchedRow[] = [];
  const unmatched: LocalRow[] = [];
  let belowThreshold = 0;

  for (const local of localRows) {
    let best: DisfraganciasProduct | null = null;
    let bestConf = 0;

    for (const ext of disfraProducts) {
      const conf = computeConfidence(local, ext);
      if (conf > bestConf) {
        bestConf = conf;
        best = ext;
      }
    }

    if (best && bestConf >= CONFIDENCE_THRESHOLD) {
      matched.push({
        brand: local.brand,
        brand_slug: local.brand_slug,
        display_name: local.display_name,
        product_slug: local.product_slug,
        local_image_key: local.local_image_key,
        external_name: best.name,
        external_slug: best.slug,
        confidence: Math.round(bestConf * 100) / 100,
        category: best.category || "",
        price_reference: best.price || 0,
        description: best.description || "",
        image_url_external: best.image_url || "",
        source: "local-assets+disfragancias",
      });
    } else {
      unmatched.push(local);
      if (best && bestConf < CONFIDENCE_THRESHOLD) belowThreshold++;
    }
  }

  // Write matched_catalog.csv
  const matchedPath = path.join(dataDir, "matched_catalog.csv");
  const matchedHeader =
    "brand,brand_slug,display_name,product_slug,local_image_key,external_name,external_slug,confidence,category,price_reference,description,image_url_external,source\n";
  const matchedBody = matched
    .map((r) =>
      [
        `"${(r.brand || "").replace(/"/g, '""')}"`,
        r.brand_slug,
        `"${(r.display_name || "").replace(/"/g, '""')}"`,
        r.product_slug,
        r.local_image_key,
        `"${(r.external_name || "").replace(/"/g, '""')}"`,
        r.external_slug,
        r.confidence,
        r.category,
        r.price_reference,
        `"${(r.description || "").replace(/"/g, '""').slice(0, 500)}"`,
        `"${(r.image_url_external || "").replace(/"/g, '""')}"`,
        r.source,
      ].join(",")
    )
    .join("\n");
  fs.writeFileSync(matchedPath, matchedHeader + matchedBody, "utf-8");

  // Write unmatched_local_products.csv
  const unmatchedPath = path.join(dataDir, "unmatched_local_products.csv");
  const unmatchedHeader =
    "brand,brand_slug,raw_name,display_name,product_slug,local_image_key,source\n";
  const unmatchedBody = unmatched
    .map((r) =>
      [
        `"${(r.brand || "").replace(/"/g, '""')}"`,
        r.brand_slug,
        `"${(r.raw_name || "").replace(/"/g, '""')}"`,
        `"${(r.display_name || "").replace(/"/g, '""')}"`,
        r.product_slug,
        r.local_image_key,
        r.source,
      ].join(",")
    )
    .join("\n");
  fs.writeFileSync(unmatchedPath, unmatchedHeader + unmatchedBody, "utf-8");

  // Write match_report.json
  const report = {
    local_products: localRows.length,
    matched: matched.length,
    unmatched: unmatched.length,
    below_threshold: belowThreshold,
    confidence_threshold: CONFIDENCE_THRESHOLD,
    disfragancias_catalog_size: disfraProducts.length,
  };
  const reportPath = path.join(dataDir, "match_report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`Matched: ${matched.length} -> ${matchedPath}`);
  console.log(`Unmatched: ${unmatched.length} -> ${unmatchedPath}`);
  console.log(`Report: ${reportPath}`);
}

main();
