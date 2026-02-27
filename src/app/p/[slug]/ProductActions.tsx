"use client";

import { PriceTag } from "@/components/ui/PriceTag";
import { AddToCartButton } from "@/components/ui/AddToCartButton";
import { WishlistButton } from "@/components/ui/WishlistButton";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

interface ProductActionsProps {
  product: ProductWithImages;
}

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
