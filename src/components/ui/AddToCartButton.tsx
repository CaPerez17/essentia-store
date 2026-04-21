"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

interface AddToCartButtonProps {
  product: ProductWithImages;
  quantity?: number;
  variant?: "default" | "compact";
  className?: string;
}

export function AddToCartButton({
  product,
  quantity = 1,
  variant = "default",
  className = "",
}: AddToCartButtonProps) {
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
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
    setAdded(true);
    showToast({
      productName: product.name,
      productBrand: product.brand,
      productImage: imageUrl ?? undefined,
    });
    setTimeout(() => setAdded(false), 2000);
  };

  const disabled = product.stock < 1;

  const stateClasses = disabled
    ? "border-[var(--muted)]/30 text-[var(--muted)]/50 cursor-not-allowed"
    : added
      ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)]"
      : "border-[var(--gold-border)] text-[var(--gold)] bg-transparent hover:border-[var(--gold)] hover:bg-[var(--gold)]/10";

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
