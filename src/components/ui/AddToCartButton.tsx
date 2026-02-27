"use client";

import { useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";

interface AddToCartButtonProps {
  product: {
    id: string;
    slug: string;
    name: string;
    brand: string;
    price: number;
    stock: number;
    images: string;
  };
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

  const images = (() => {
    try {
      const arr = JSON.parse(product.images || "[]") as string[];
      return arr[0] ?? null;
    } catch {
      return null;
    }
  })();

  const handleClick = () => {
    if (product.stock < 1) return;
    const item: Omit<CartItem, "quantity"> & { quantity?: number } = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: images ?? undefined,
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
        className={`px-4 py-2 text-sm font-medium border border-[var(--accent)] bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {disabled ? "Sin stock" : added ? "Añadido" : "Añadir"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`w-full py-3 px-6 text-sm font-medium border border-[var(--accent)] bg-[var(--accent)] text-white transition-colors hover:bg-[var(--accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {disabled ? "Sin stock" : added ? "Añadido al carrito" : "Añadir al carrito"}
    </button>
  );
}
