"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";
import { track } from "@/lib/analytics";
import { meta } from "@/lib/meta-pixel";
import { tiktok } from "@/lib/tiktok-pixel";

interface AddToCartButtonProps {
  product: ProductWithImages;
  quantity?: number;
  variant?: "default" | "compact";
  /** "dark" (default) for dark backgrounds; "light" for white-card contexts (arabes, catalogo). */
  tone?: "dark" | "light";
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  variant = "default",
  tone = "dark",
  className = "",
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
  const openMiniCart = useMiniCartStore((s) => s.open);
  const [added, setAdded] = useState(false);

  const imageUrl = getProductFirstImageUrl(product);

  const handleClick = () => {
    if (product.stock < 1) return;
    const item: Omit<CartItem, "quantity"> & { quantity?: number } = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: imageUrl ?? undefined,
    };
    addItem({ ...item, quantity });

    // Analytics: GA4 + Meta Pixel + TikTok Pixel (no-ops if pixels not loaded)
    const trackPayload = {
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      quantity,
    };
    track.addToCart(trackPayload);
    meta.addToCart(trackPayload);
    tiktok.addToCart(trackPayload);

    setAdded(true);
    showToast({
      productName: product.name,
      productBrand: product.brand,
      productImage: imageUrl ?? undefined,
    });
    // Open mini cart drawer with slight delay so user sees toast + transition
    setTimeout(() => openMiniCart(), 150);
    setTimeout(() => setAdded(false), 2000);
  };

  const disabled = product.stock < 1;

  // Color set
  const stateClasses = (() => {
    if (disabled) {
      return tone === "light"
        ? "border-[#E5E5E5] text-[#6B6B6B]/50 cursor-not-allowed"
        : "border-[var(--muted)]/30 text-[var(--muted)]/50 cursor-not-allowed";
    }
    if (added) {
      return "border-[#C9A96E] bg-[#C9A96E] text-[#0D0D0D]";
    }
    if (tone === "light") {
      return "border-[#0D0D0D] bg-[#0D0D0D] text-white hover:bg-[#C9A96E] hover:border-[#C9A96E] hover:text-[#0D0D0D]";
    }
    return "border-[var(--gold-border)] text-[#C9A96E] bg-transparent hover:border-[#C9A96E] hover:bg-[#C9A96E]/10";
  })();

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`w-full py-2 text-[9px] uppercase tracking-[0.18em] font-normal border transition-colors duration-300 ${stateClasses} ${className}`}
      >
        {disabled ? "Agotado" : added ? "✓ Agregado" : "Agregar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-3 px-6 text-[10px] uppercase tracking-[0.18em] font-normal border transition-colors duration-300 ${stateClasses} ${className}`}
    >
      {disabled ? "Agotado" : added ? "✓ Agregado al carrito" : "Añadir al carrito"}
    </button>
  );
}
