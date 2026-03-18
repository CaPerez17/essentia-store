/**
 * Build Essentia pricing sheet from catalog_with_provider_prices.csv.
 * Output: data/essentia_pricing_sheet.csv
 */
import * as fs from "fs";
import * as path from "path";

const ENTRY_MAX = 180000;
const CORE_MAX = 320000;

type PricingTier = "entry" | "core" | "premium";

interface CatalogWithPricesRow {
  brand: string;
  name: string;
  slug: string;
  category: string;
  imageKey: string;
  provider_product_name: string;
  provider_source_raw: string;
  provider_price_cop: string;
  provider_ml: string;
  provider_gender: string;
  match_confidence: string;
}

interface PricingRow {
  brand: string;
  name: string;
  slug: string;
  cost_cop: number;
  sale_price_cop: number;
  gross_margin_cop: number;
  gross_margin_pct: number;
  pricing_tier: PricingTier;
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

function getPricingTier(cost: number): PricingTier {
  if (cost < ENTRY_MAX) return "entry";
  if (cost <= CORE_MAX) return "core";
  return "premium";
}

function getMarkupMultiplier(tier: PricingTier): number {
  switch (tier) {
    case "entry":
      return 1.55;
    case "core":
      return 1.65;
    case "premium":
      return 1.75;
  }
}

function roundToNearest1000(n: number): number {
  return Math.round(n / 1000) * 1000;
}

function main() {
  const dataDir = path.join(process.cwd(), "data");
  const inputPath = path.join(dataDir, "catalog_with_provider_prices.csv");

  if (!fs.existsSync(inputPath)) {
    console.error("Run prices:match first. Missing:", inputPath);
    process.exit(1);
  }

  const rows = parseCsv(fs.readFileSync(inputPath, "utf-8")) as unknown as CatalogWithPricesRow[];

  const pricing: PricingRow[] = rows.map((r) => {
    const cost = parseInt(r.provider_price_cop, 10) || 0;
    const tier = getPricingTier(cost);
    const multiplier = getMarkupMultiplier(tier);
    const sale = roundToNearest1000(cost * multiplier);
    const margin = sale - cost;
    const marginPct = sale > 0 ? margin / sale : 0;

    return {
      brand: r.brand,
      name: r.name,
      slug: r.slug,
      cost_cop: cost,
      sale_price_cop: sale,
      gross_margin_cop: margin,
      gross_margin_pct: Math.round(marginPct * 10000) / 10000,
      pricing_tier: tier,
    };
  });

  const header =
    "brand,name,slug,cost_cop,sale_price_cop,gross_margin_cop,gross_margin_pct,pricing_tier\n";
  const escape = (val: string) => `"${(val || "").replace(/"/g, '""')}"`;
  const body = pricing
    .map((r) =>
      [
        escape(r.brand),
        escape(r.name),
        r.slug,
        r.cost_cop,
        r.sale_price_cop,
        r.gross_margin_cop,
        r.gross_margin_pct,
        r.pricing_tier,
      ].join(",")
    )
    .join("\n");

  const outPath = path.join(dataDir, "essentia_pricing_sheet.csv");
  fs.writeFileSync(outPath, header + body, "utf-8");

  console.log(`Wrote ${pricing.length} rows to ${outPath}`);
}

main();
