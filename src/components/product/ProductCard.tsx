"use client";

import Link from "next/link";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

export type ProductCardVariant = "dark" | "light" | "editorial";

interface ProductCardProps {
  product: ProductWithImages;
  showAddToCart?: boolean;
  variant?: ProductCardVariant;
  /** Optional badge text override (e.g. "ÁRABE", "NUEVO") */
  badge?: string | null;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function ProductCard({
  product,
  showAddToCart = true,
  variant = "dark",
  badge,
}: ProductCardProps) {
  const imageUrl = getProductFirstImageUrl(product);

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: imageUrl || undefined,
  };

  // Determine auto-badge if none provided
  const autoBadge =
    badge !== undefined
      ? badge
      : product.onSale
        ? "OFERTA -10%"
        : null;

  if (variant === "editorial") {
    return (
      <article className="pcard group relative block aspect-[3/4] overflow-hidden bg-[#0D0D0D]">
        <Link href={`/p/${product.slug}`} className="block h-full w-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="pcard-img h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#C9A96E]/40 text-xs uppercase tracking-widest">
              {product.brand}
            </div>
          )}
        </Link>

        {/* Overlay gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/40 to-transparent opacity-90 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Wishlist top-right */}
        <div className="absolute top-3 right-3 z-10">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>

        {/* Badge */}
        {autoBadge && (
          <span className="absolute top-3 left-3 z-10 text-[8px] uppercase tracking-[0.2em] text-[#0D0D0D] bg-[#C9A96E] px-2 py-1">
            {autoBadge}
          </span>
        )}

        {/* Content bottom */}
        <div className="absolute inset-x-0 bottom-0 p-5 z-10">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
            {product.brand}
          </p>
          <Link href={`/p/${product.slug}`} className="block">
            <h3 className="pcard-title font-serif text-lg text-white group-hover:text-[#C9A96E] transition-colors mb-2 leading-tight">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-white/70 mb-3">
            {fmt(product.price)}
            {product.compareAt != null && product.compareAt > product.price && (
              <span className="ml-2 line-through opacity-50">
                {fmt(product.compareAt)}
              </span>
            )}
          </p>
          <span className="inline-block text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Ver fragancia →
          </span>
        </div>
      </article>
    );
  }

  if (variant === "light") {
    return (
      <article className="pcard group bg-white border border-[#E5E5E5] hover:border-[#C9A96E] transition-colors">
        <div className="relative aspect-[3/4] bg-[#F5F0E8] overflow-hidden">
          <Link href={`/p/${product.slug}`} className="block h-full">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="pcard-img h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
                {product.brand}
              </div>
            )}
          </Link>
          <div className="absolute top-3 right-3">
            <WishlistButton item={wishlistItem} size="sm" />
          </div>
          {autoBadge && (
            <span className="absolute top-3 left-3 text-[8px] uppercase tracking-[0.2em] text-[#0D0D0D] bg-[#C9A96E] px-2 py-1">
              {autoBadge}
            </span>
          )}
        </div>
        <div className="p-4">
          <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
            {product.brand}
          </p>
          <Link href={`/p/${product.slug}`} className="block">
            <h3 className="pcard-title font-serif text-sm text-[#0D0D0D] group-hover:text-[#C9A96E] transition-colors mb-2">
              {product.name}
            </h3>
          </Link>
          <p className="text-xs text-[#0D0D0D] mb-3">
            {fmt(product.price)}
            {product.compareAt != null && product.compareAt > product.price && (
              <span className="ml-2 line-through text-[#6B6B6B] opacity-70">
                {fmt(product.compareAt)}
              </span>
            )}
          </p>
          {showAddToCart && (
            <AddToCartButton product={product} variant="compact" tone="light" />
          )}
        </div>
      </article>
    );
  }

  // Default: dark variant
  return (
    <article className="pcard group bg-[#1A1A1A] border border-transparent hover:border-[var(--gold-border)]">
      <div className="relative aspect-[3/4] bg-[#0D0D0D] overflow-hidden">
        <Link href={`/p/${product.slug}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="pcard-img h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
              {product.brand}
            </div>
          )}
        </Link>
        <div className="absolute top-3 right-3">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>
        {autoBadge && (
          <span className="absolute top-3 left-3 text-[8px] uppercase tracking-[0.2em] text-[#C9A96E] border border-[var(--gold-border)] px-2 py-1 bg-[#0D0D0D]/80 backdrop-blur-sm">
            {autoBadge}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1">
          {product.brand}
        </p>
        <Link href={`/p/${product.slug}`} className="block">
          <h3 className="pcard-title font-serif text-sm text-white group-hover:text-[#C9A96E] transition-colors mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-[#6B6B6B] mb-3">
          {fmt(product.price)}
          {product.compareAt != null && product.compareAt > product.price && (
            <span className="ml-2 line-through opacity-50">
              {fmt(product.compareAt)}
            </span>
          )}
        </p>
        {showAddToCart && (
          <AddToCartButton product={product} variant="compact" />
        )}
      </div>
    </article>
  );
}
