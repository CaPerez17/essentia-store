"use client";

import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { ScarcityBar } from "@/components/product/ScarcityBar";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

interface ProductActionsProps {
  product: ProductWithImages;
}

const fmt = (n: number) =>
  "$\u00A0" + n.toLocaleString("es-CO", { maximumFractionDigits: 0 });

export function ProductActions({ product }: ProductActionsProps) {
  const imageUrl = getProductFirstImageUrl(product);

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: imageUrl ?? undefined,
  };

  return (
    <div className="space-y-6">
      {/* Price */}
      <div>
        <div className="flex items-baseline gap-3">
          <span className="font-serif text-4xl text-[var(--gold)]">
            {fmt(product.price)}
          </span>
          {product.compareAt != null && product.compareAt > product.price && (
            <span className="text-sm text-[var(--muted)]/60 line-through">
              {fmt(product.compareAt)}
            </span>
          )}
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--muted)] mt-1">
          IVA incluido · Envío gratis
        </p>
      </div>

      {/* Stock / scarcity */}
      <ScarcityBar stock={product.stock} />

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <div className="flex-1">
          <AddToCartButton product={product} />
        </div>
        <WishlistButton item={wishlistItem} size="md" />
      </div>

      {/* Trust bar */}
      <div className="grid grid-cols-3 gap-2 pt-4">
        <div className="text-center p-3 border border-[var(--gold-border)]/50">
          <p className="text-[var(--gold)] text-sm mb-1">✓</p>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[var(--muted)] leading-tight">Original<br/>garantizado</p>
        </div>
        <div className="text-center p-3 border border-[var(--gold-border)]/50">
          <p className="text-[var(--gold)] text-sm mb-1">📦</p>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[var(--muted)] leading-tight">Envío<br/>Colombia</p>
        </div>
        <div className="text-center p-3 border border-[var(--gold-border)]/50">
          <p className="text-[var(--gold)] text-sm mb-1">🔒</p>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[var(--muted)] leading-tight">Pago con<br/>Wompi</p>
        </div>
      </div>
    </div>
  );
}
