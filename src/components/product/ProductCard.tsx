"use client";

import Link from "next/link";
import { PriceTag } from "@/components/ui/PriceTag";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import type { Product } from "@prisma/client";

interface ProductCardProps {
  product: Product;
  showAddToCart?: boolean;
}

function parseJsonArray(str: string | null): string[] {
  if (!str) return [];
  try {
    const arr = JSON.parse(str) as unknown;
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function parseTags(str: string | null): string[] {
  return parseJsonArray(str);
}

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const images = parseJsonArray(product.images);
  const tags = parseTags(product.tags);
  const imageUrl = images[0];

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: imageUrl || undefined,
  };

  return (
    <article className="group border border-[var(--border)] bg-[var(--bg-card)]">
      <div className="relative aspect-[3/4] bg-[var(--bg)] overflow-hidden">
        <Link href={`/p/${product.slug}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[var(--text-muted)] text-sm">
              {product.brand}
            </div>
          )}
        </Link>
        <div className="absolute top-2 right-2">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>
        {product.onSale && (
          <span className="absolute top-2 left-2 bg-[var(--accent)] text-white text-xs px-2 py-0.5">
            Oferta
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
          {product.brand}
        </p>
        <Link href={`/p/${product.slug}`} className="block">
          <h3 className="font-medium text-[var(--text)] hover:underline mb-2">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center justify-between gap-2 mb-3">
          <PriceTag price={product.price} compareAt={product.compareAt} size="sm" />
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="text-xs text-[var(--text-muted)] border border-[var(--border)] px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        {showAddToCart && (
          <AddToCartButton product={product} variant="compact" />
        )}
      </div>
    </article>
  );
}
