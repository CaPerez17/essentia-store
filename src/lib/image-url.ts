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
