"use client";

import { useWishlistStore, type WishlistItem } from "@/stores/wishlist-store";

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
  size?: "sm" | "md";
}

export function WishlistButton({ item, className = "", size = "md" }: WishlistButtonProps) {
  const { hasItem, toggleItem } = useWishlistStore();
  const isInWishlist = hasItem(item.productId);

  const sizeClasses = size === "sm" ? "w-8 h-8" : "w-10 h-10";

  return (
    <button
      type="button"
      aria-label={isInWishlist ? "Quitar de wishlist" : "Añadir a wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleItem(item);
      }}
      className={`${sizeClasses} flex items-center justify-center border border-[var(--border)] bg-[var(--bg-card)] transition-colors hover:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)] ${className}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill={isInWishlist ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={1.5}
        className={`${size === "sm" ? "w-4 h-4" : "w-5 h-5"} ${isInWishlist ? "text-[var(--accent)]" : "text-[var(--text-muted)]"}`}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"
        />
      </svg>
    </button>
  );
}
