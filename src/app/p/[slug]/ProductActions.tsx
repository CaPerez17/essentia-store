"use client";

import { PriceTag } from "@/components/ui/PriceTag";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { WishlistButton } from "@/components/ui/WishlistButton";
import type { Product } from "@prisma/client";

interface ProductActionsProps {
  product: Product;
}

export function ProductActions({ product }: ProductActionsProps) {
  const images = (() => {
    try {
      const arr = JSON.parse(product.images || "[]") as string[];
      return arr[0] ?? null;
    } catch {
      return null;
    }
  })();

  const wishlistItem = {
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    price: product.price,
    image: images ?? undefined,
  };

  return (
    <div className="space-y-4">
      <PriceTag price={product.price} compareAt={product.compareAt} size="lg" />
      <div className="flex gap-3">
        <div className="flex-1">
          <AddToCartButton product={product} />
        </div>
        <WishlistButton item={wishlistItem} size="md" />
      </div>
    </div>
  );
}
