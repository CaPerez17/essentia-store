"use client";

import Link from "next/link";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

interface CatalogProductCardProps {
  product: ProductWithImages;
}

/**
 * Product card specifically for the /catalogo grid.
 * Features a hover action bar (Agregar + Wishlist) that slides up from the bottom.
 * Image uses object-contain on a soft cream background for unified perfume-bottle presentation.
 */
export function CatalogProductCard({ product }: CatalogProductCardProps) {
  const imageUrl = getProductFirstImageUrl(product);

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: imageUrl || undefined,
  };

  // Determine badge
  let badge: { label: string; className: string } | null = null;
  if (product.onSale) {
    badge = {
      label: "OFERTA",
      className: "text-[#0D0D0D] bg-[#C9A96E]",
    };
  } else if (product.isNew) {
    badge = {
      label: "NUEVO",
      className: "text-white bg-[#2F4F2F]",
    };
  } else if (product.featured) {
    badge = {
      label: "EXCLUSIVO",
      className: "text-white bg-[#0D0D0D]",
    };
  }

  const hasDiscount =
    product.compareAt != null && product.compareAt > product.price;

  return (
    <article className="pcard group bg-white border border-[#E5E5E5] hover:border-[#C9A96E] transition-colors duration-300 flex flex-col">
      {/* Image area */}
      <div className="relative aspect-[3/4] bg-[#F8F5EF] overflow-hidden">
        <Link href={`/p/${product.slug}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="pcard-img h-full w-full object-contain p-6"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[#6B6B6B] text-xs uppercase tracking-widest">
              {product.brand}
            </div>
          )}
        </Link>

        {/* Badge top-left */}
        {badge && (
          <span
            className={`absolute top-3 left-3 text-[8px] uppercase tracking-[0.2em] px-2 py-1 ${badge.className}`}
          >
            {badge.label}
          </span>
        )}

        {/* Wishlist always-visible (top-right) */}
        <div className="absolute top-3 right-3">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>

        {/* Hover action bar (slides up from bottom) */}
        <div className="pcard-actions absolute inset-x-0 bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-[#E5E5E5] p-3">
          <AddToCartButton product={product} variant="compact" tone="light" />
        </div>
      </div>

      {/* Text content */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[#C9A96E] mb-1 truncate">
          {product.brand}
        </p>
        <Link href={`/p/${product.slug}`} className="block mb-2">
          <h3
            className="pcard-title font-serif text-sm leading-snug text-[#0D0D0D] group-hover:text-[#C9A96E] transition-colors"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {product.name}
          </h3>
        </Link>
        <div className="mt-auto flex items-baseline gap-2">
          <span
            className={`text-[13px] ${
              hasDiscount ? "text-red-700" : "text-[#0D0D0D]"
            }`}
          >
            {fmt(product.price)}
          </span>
          {hasDiscount && (
            <span className="text-[11px] text-[#6B6B6B] line-through">
              {fmt(product.compareAt!)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
