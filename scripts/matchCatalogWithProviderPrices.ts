/**
 * Match Essentia catalog with provider prices.
 * Fuzzy match by brand + product name. Use ml/gender as secondary signals.
 * Do NOT auto-match low confidence rows - they go to catalog_without_provider_prices.
 */
import * as fs from "fs";
import * as path from "path";

const MIN_CONFIDENCE_FOR_MATCH = 0.65;
const LOW_CONFIDENCE_THRESHOLD = 0.85; // Below this = low_confidence_matches in report

interface CatalogRow {
  name: string;
  slug: string;
  brand: string;
  category: string;
  gender: string;
  price: string;
  stock: string;
  description: string;
  imageKey: string;
  source: string;
  externalName: string;
  confidence: string;
}

interface ProviderRow {
  brand: string;
  product_name: string;
  ml: string;
  gender: string;
  price_cop: string;
  source_raw: string;
}

interface MatchedCatalogRow {
  brand: string;
  name: string;
  slug: string;
  category: string;
  imageKey: string;
  provider_product_name: string;
  provider_source_raw: string;
  provider_price_cop: number;
  provider_ml: string;
  provider_gender: string;
  match_confidence: number;
}

interface UnmatchedCatalogRow {
  brand: string;
  name: string;
  slug: string;
  category: string;
  imageKey: string;
}

interface UnusedProviderRow {
  brand: string;
  product_name: string;
  ml: string;
  gender: string;
  price_cop: string;
  source_raw: string;
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
      result.push(current.trim().replace(/^"|"$/g, ""));
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim().replace(/^"|"$/g, ""));
  return result;
}

/** Normalize for matching: spaces, hyphens, 9pm/9 pm, intense/intensa, strip filler tokens */
function normalizeForMatch(s: string): string {
  let t = s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .replace(/[-–—]/g, " ")
    .trim();
  // 9pm / 9 pm -> 9pm
  t = t.replace(/\b9\s+pm\b/g, "9pm").replace(/\b9\s+am\b/g, "9am");
  // intense / intensa (typo normalization)
  t = t.replace(/\bintensa\b/g, "intense").replace(/\bintense\b/g, "intense");
  // Strip filler tokens (for matching only)
  const fillers = /\b(parfum|perfume|edp|edt|eau de|extrait|spray|locion|lotion)\b/gi;
  t = t.replace(fillers, " ").replace(/\s+/g, " ").trim();
  return t;
}

function tokenize(s: string): Set<string> {
  return new Set(
    normalizeForMatch(s)
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  const inter = [...a].filter((x) => b.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union > 0 ? inter / union : 0;
}

function brandSimilarity(catBrand: string, provBrand: string): number {
  const ca = normalizeForMatch(catBrand);
  const cb = normalizeForMatch(provBrand);
  if (ca === cb) return 1;
  if (ca.includes(cb) || cb.includes(ca)) return 0.95;
  const ta = tokenize(catBrand);
  const tb = tokenize(provBrand);
  return jaccard(ta, tb);
}

function productSimilarity(catName: string, provName: string): number {
  const ta = tokenize(catName);
  const tb = tokenize(provName);
  const j = jaccard(ta, tb);
  if (j > 0) return j;
  const ca = normalizeForMatch(catName);
  const cb = normalizeForMatch(provName);
  if (ca.includes(cb) || cb.includes(ca)) return 0.75;
  return 0;
}

function computeConfidence(
  catalog: CatalogRow,
  provider: ProviderRow,
  brandScore: number,
  productScore: number
): number {
  let conf = 0.45 * brandScore + 0.55 * productScore;
  // Boost if ml matches (catalog slug/name may contain ml)
  const catHasMl = /\d+\s*ml|\d+ml/i.test(catalog.name) || /\d+ml/i.test(catalog.slug);
  const provMl = provider.ml ? parseInt(provider.ml, 10) : null;
  if (catHasMl && provMl && catalog.slug.includes(String(provMl))) {
    conf += 0.05;
  }
  // Small boost if gender aligns
  const catGender = (catalog.gender || "").toLowerCase();
  const provGender = (provider.gender || "").toLowerCase();
  if (catGender && provGender && (catGender === provGender || provGender === "unisex")) {
    conf += 0.02;
  }
  return Math.min(1, conf);
}

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const catalogPath = path.join(dataDir, "essentia_catalog_candidate.csv");
  const providerPath = path.join(dataDir, "provider_prices_2026.csv");

  if (!fs.existsSync(catalogPath)) {
    console.error("Missing:", catalogPath);
    process.exit(1);
  }
  if (!fs.existsSync(providerPath)) {
    console.error("Missing:", providerPath);
    process.exit(1);
  }

  const catalogRows = parseCsv(fs.readFileSync(catalogPath, "utf-8")) as unknown as CatalogRow[];
  const providerRows = parseCsv(fs.readFileSync(providerPath, "utf-8")) as unknown as ProviderRow[];

  const matched: MatchedCatalogRow[] = [];
  const unmatched: UnmatchedCatalogRow[] = [];
  const lowConfidenceMatches: { catalog_name: string; provider_product_name: string; confidence: number }[] = [];
  const usedProviderIndices = new Set<number>();

  for (const cat of catalogRows) {
    const catProductName = cat.externalName || cat.name;
    let best: ProviderRow | null = null;
    let bestConf = 0;
    let bestIdx = -1;

    for (let i = 0; i < providerRows.length; i++) {
      const prov = providerRows[i]!;
      const brandScore = brandSimilarity(cat.brand, prov.brand);
      if (brandScore < 0.5) continue;

      const productScore = productSimilarity(catProductName, prov.product_name);
      const conf = computeConfidence(cat, prov, brandScore, productScore);

      if (conf > bestConf) {
        bestConf = conf;
        best = prov;
        bestIdx = i;
      }
    }

    if (best && bestConf >= MIN_CONFIDENCE_FOR_MATCH) {
      matched.push({
        brand: cat.brand,
        name: cat.name,
        slug: cat.slug,
        category: cat.category || "",
        imageKey: cat.imageKey || "",
        provider_product_name: best.product_name,
        provider_source_raw: best.source_raw,
        provider_price_cop: parseInt(best.price_cop, 10) || 0,
        provider_ml: best.ml || "",
        provider_gender: best.gender || "",
        match_confidence: Math.round(bestConf * 100) / 100,
      });
      if (bestIdx >= 0) usedProviderIndices.add(bestIdx);
      if (bestConf < LOW_CONFIDENCE_THRESHOLD) {
        lowConfidenceMatches.push({
          catalog_name: cat.name,
          provider_product_name: best.product_name,
          confidence: bestConf,
        });
      }
    } else {
      unmatched.push({
        brand: cat.brand,
        name: cat.name,
        slug: cat.slug,
        category: cat.category || "",
        imageKey: cat.imageKey || "",
      });
    }
  }

  const unusedProviders: UnusedProviderRow[] = providerRows
    .filter((_, i) => !usedProviderIndices.has(i))
    .map((p) => ({
      brand: p.brand,
      product_name: p.product_name,
      ml: p.ml,
      gender: p.gender,
      price_cop: p.price_cop,
      source_raw: p.source_raw,
    }));

  function escapeCsv(val: string): string {
    return `"${(val || "").replace(/"/g, '""')}"`;
  }

  // catalog_with_provider_prices.csv
  const matchedHeader =
    "brand,name,slug,category,imageKey,provider_product_name,provider_source_raw,provider_price_cop,provider_ml,provider_gender,match_confidence\n";
  const matchedBody = matched
    .map(
      (r) =>
        [
          escapeCsv(r.brand),
          escapeCsv(r.name),
          r.slug,
          escapeCsv(r.category),
          r.imageKey,
          escapeCsv(r.provider_product_name),
          escapeCsv(r.provider_source_raw),
          r.provider_price_cop,
          r.provider_ml,
          r.provider_gender,
          r.match_confidence,
        ].join(",")
    )
    .join("\n");
  fs.writeFileSync(
    path.join(dataDir, "catalog_with_provider_prices.csv"),
    matchedHeader + matchedBody,
    "utf-8"
  );

  // catalog_without_provider_prices.csv
  const unmatchedHeader = "brand,name,slug,category,imageKey\n";
  const unmatchedBody = unmatched
    .map((r) =>
      [escapeCsv(r.brand), escapeCsv(r.name), r.slug, escapeCsv(r.category), r.imageKey].join(",")
    )
    .join("\n");
  fs.writeFileSync(
    path.join(dataDir, "catalog_without_provider_prices.csv"),
    unmatchedHeader + unmatchedBody,
    "utf-8"
  );

  // provider_prices_unused.csv
  const unusedHeader = "brand,product_name,ml,gender,price_cop,source_raw\n";
  const unusedBody = unusedProviders
    .map((r) =>
      [
        escapeCsv(r.brand),
        escapeCsv(r.product_name),
        r.ml,
        r.gender,
        r.price_cop,
        escapeCsv(r.source_raw),
      ].join(",")
    )
    .join("\n");
  fs.writeFileSync(
    path.join(dataDir, "provider_prices_unused.csv"),
    unusedHeader + unusedBody,
    "utf-8"
  );

  const report = {
    catalog_total: catalogRows.length,
    matched_total: matched.length,
    unmatched_total: unmatched.length,
    provider_total: providerRows.length,
    provider_unused_total: unusedProviders.length,
    low_confidence_matches: lowConfidenceMatches,
    min_confidence_for_match: MIN_CONFIDENCE_FOR_MATCH,
  };

  fs.writeFileSync(
    path.join(dataDir, "provider_price_match_report.json"),
    JSON.stringify(report, null, 2),
    "utf-8"
  );

  console.log(`Matched: ${matched.length} -> ${path.join(dataDir, "catalog_with_provider_prices.csv")}`);
  console.log(`Unmatched: ${unmatched.length} -> ${path.join(dataDir, "catalog_without_provider_prices.csv")}`);
  console.log(`Unused: ${unusedProviders.length} -> ${path.join(dataDir, "provider_prices_unused.csv")}`);
  console.log(`Report: ${path.join(dataDir, "provider_price_match_report.json")}`);
  if (lowConfidenceMatches.length > 0) {
    console.log(`Low confidence matches (review): ${lowConfidenceMatches.length}`);
  }
}

main();
