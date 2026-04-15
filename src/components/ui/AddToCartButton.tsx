"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
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
    setTimeout(() => setAdded(false), 1500);
  };

  const disabled = product.stock < 1;

  if (variant === "compact") {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className={`w-full py-2 text-[9px] uppercase tracking-[0.18em] font-normal border transition-colors duration-300 ${
          disabled
            ? "border-[var(--muted)]/30 text-[var(--muted)]/50 cursor-not-allowed"
            : added
              ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)]"
              : "border-[var(--gold-border)] text-[var(--gold)] bg-transparent hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
        } ${className}`}
      >
        {disabled ? "Agotado" : added ? "Añadido" : "Agregar"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-3 px-6 text-[10px] uppercase tracking-[0.18em] font-normal border transition-colors duration-300 ${
        disabled
          ? "border-[var(--muted)]/30 text-[var(--muted)]/50 cursor-not-allowed"
          : added
            ? "border-[var(--gold)] bg-[var(--gold)] text-[var(--dark)]"
            : "border-[var(--gold-border)] text-[var(--gold)] bg-transparent hover:border-[var(--gold)] hover:bg-[var(--gold)]/10"
      } ${className}`}
    >
      {disabled ? "Agotado" : added ? "Añadido al carrito" : "Añadir al carrito"}
    </button>
  );
}
