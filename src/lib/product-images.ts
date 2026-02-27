import { resolveImageUrl } from "./image-url";
import type { Product, ProductImage } from "@prisma/client";

export type ProductWithImages = Product & { images?: ProductImage[] };

function parseLegacyImages(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const arr = JSON.parse(json) as unknown;
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/**
 * Returns resolved image URLs for a product.
 * Prefers ProductImage (S3 keys) over legacy imagesLegacy (JSON URLs).
 */
export function getProductImageUrls(product: ProductWithImages): string[] {
  const imgs = product.images;
  if (imgs && imgs.length > 0) {
    return [...imgs]
      .sort((a, b) => a.position - b.position)
      .map((i) => resolveImageUrl(i.key));
  }
  const legacy = parseLegacyImages(product.imagesLegacy ?? undefined);
  return legacy;
}

/**
 * Returns the first image URL or null.
 */
export function getProductFirstImageUrl(product: ProductWithImages): string | null {
  const urls = getProductImageUrls(product);
  return urls[0] ?? null;
}
