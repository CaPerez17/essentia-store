"use client";

import Link from "next/link";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

interface ProductCardProps {
  product: ProductWithImages;
  showAddToCart?: boolean;
}

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function ProductCard({ product, showAddToCart = true }: ProductCardProps) {
  const imageUrl = getProductFirstImageUrl(product);

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: imageUrl || undefined,
  };

  return (
    <article className="group bg-[var(--dark)] border border-transparent hover:border-[var(--gold-border)] transition-colors duration-300">
      <div className="relative aspect-[3/4] bg-[#111009] overflow-hidden">
        <Link href={`/p/${product.slug}`} className="block h-full">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-[var(--muted)] text-xs uppercase tracking-widest">
              {product.brand}
            </div>
          )}
        </Link>
        <div className="absolute top-3 right-3">
          <WishlistButton item={wishlistItem} size="sm" />
        </div>
        {product.onSale && (
          <span className="absolute top-3 left-3 text-[8px] uppercase tracking-[0.2em] text-[var(--gold)] border border-[var(--gold-border)] px-2 py-1 bg-[var(--dark)]/80 backdrop-blur-sm">
            Oferta
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--gold)] mb-1">
          {product.brand}
        </p>
        <Link href={`/p/${product.slug}`} className="block">
          <h3 className="font-serif text-sm text-[var(--cream)] group-hover:text-[var(--gold)] transition-colors duration-300 mb-2">
            {product.name}
          </h3>
        </Link>
        <p className="text-xs text-[var(--muted)] mb-3">
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
