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
