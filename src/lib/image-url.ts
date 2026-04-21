import { LIFESTYLE_BRAND_BANNERS } from "./lifestyle-brands";

/**
 * Resolves image URL from S3 object key.
 * If key already looks like http(s), returns as-is.
 */
export function resolveImageUrl(key: string): string {
  if (!key || typeof key !== "string") return "";
  const trimmed = key.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const base = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL || "";
  if (!base) return trimmed; // Fallback: return key as-is if no base configured
  const normalizedBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const normalizedKey = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${normalizedBase}/${normalizedKey}`;
}

/** Full public URL for a single S3 key. */
export function getProductImageUrl(key: string): string {
  return resolveImageUrl(key);
}

/** Resolves an array of ProductImage-like objects into ordered {src, alt} pairs. */
export function getProductImages(
  images: { key: string; alt: string; position: number }[],
): { src: string; alt: string }[] {
  return [...images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ src: resolveImageUrl(img.key), alt: img.alt }));
}

// ─────────────────────────────────────────────
// Lifestyle (editorial) brand image helpers
// ─────────────────────────────────────────────

function slugifyBrand(brand: string): string {
  return brand
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns the public S3 URL for a brand's lifestyle banner.
 * @param brand Brand name (e.g. "Armaf", "Carolina Herrera")
 * @param position 0, 1, or 2 — which banner file (default 0)
 * @returns URL or null if the brand doesn't have a lifestyle image
 */
export function getBrandLifestyleImage(
  brand: string | null | undefined,
  position: 0 | 1 | 2 = 0,
): string | null {
  if (!brand) return null;
  const slug = slugifyBrand(brand);
  const banners = LIFESTYLE_BRAND_BANNERS[slug];
  if (!banners || banners.length === 0) return null;
  const filename = banners[position] ?? banners[0]!;
  return resolveImageUrl(`lifestyle/${slug}/${filename}`);
}

/** Quick check if a brand has any lifestyle image available. */
export function hasBrandLifestyle(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const slug = slugifyBrand(brand);
  return Boolean(LIFESTYLE_BRAND_BANNERS[slug]?.length);
}
