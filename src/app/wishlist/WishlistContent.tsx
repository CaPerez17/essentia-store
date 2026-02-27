"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useWishlistStore } from "@/stores/wishlist-store";
import { ProductCard } from "@/components/product/ProductCard";

export function WishlistContent() {
  const items = useWishlistStore((s) => s.items);
  const [shareStatus, setShareStatus] = useState<"idle" | "loading" | "copied" | "error">("idle");

  const handleShare = async () => {
    if (items.length === 0) return;
    setShareStatus("loading");
    try {
      const res = await fetch("/api/wishlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productIds: items.map((i) => i.productId),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error");
      await navigator.clipboard.writeText(json.url);
      setShareStatus("copied");
      setTimeout(() => setShareStatus("idle"), 2000);
    } catch {
      setShareStatus("error");
      setTimeout(() => setShareStatus("idle"), 2000);
    }
  };

  const productProps = useMemo(
    () =>
      items.map((i) => ({
        id: i.productId,
        slug: i.slug,
        name: i.name,
        brand: i.brand,
        description: null,
        price: i.price,
        compareAt: null,
        stock: 99,
        images: i.image ? JSON.stringify([i.image]) : "[]",
        family: null,
        occasion: null,
        intensity: null,
        gender: null,
        tags: "[]",
        featured: false,
        isNew: false,
        onSale: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      })),
    [items]
  );

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-[var(--text-muted)] mb-6">Tu wishlist está vacía.</p>
        <Link
          href="/catalogo"
          className="inline-block border border-[var(--accent)] px-6 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)] hover:text-white"
        >
          Explorar catálogo
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={handleShare}
          disabled={shareStatus === "loading"}
          className="border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text)] hover:border-[var(--accent)] transition-colors disabled:opacity-50"
        >
          {shareStatus === "loading"
            ? "Generando..."
            : shareStatus === "copied"
              ? "Enlace copiado"
              : shareStatus === "error"
                ? "Error"
                : "Compartir wishlist"}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {productProps.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}
