"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore, type CartItem } from "@/stores/cart-store";
import { useToastStore } from "@/stores/toast-store";
import { useMiniCartStore } from "@/stores/mini-cart-store";
import { getProductFirstImageUrl, type ProductWithImages } from "@/lib/product-images";

interface StickyAddToCartProps {
  product: ProductWithImages;
  /** CSS selector for the "main" add-to-cart element to observe */
  observeSelector?: string;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);

export function StickyAddToCart({
  product,
  observeSelector = "[data-main-add-to-cart]",
}: StickyAddToCartProps) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);
  const openMiniCart = useMiniCartStore((s) => s.open);

  useEffect(() => {
    const target = document.querySelector(observeSelector);
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        // Visible when main button is out of view (below or above viewport)
        setVisible(!entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "0px" },
    );
    observerRef.current.observe(target);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [observeSelector]);

  const imageUrl = getProductFirstImageUrl(product);
  const disabled = product.stock < 1;

  const handleClick = () => {
    if (disabled) return;
    const item: Omit<CartItem, "quantity"> & { quantity?: number } = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      brand: product.brand,
      price: product.price,
      image: imageUrl ?? undefined,
    };
    addItem({ ...item, quantity: 1 });
    showToast({
      productName: product.name,
      productBrand: product.brand,
      productImage: imageUrl ?? undefined,
    });
    setTimeout(() => openMiniCart(), 150);
  };

  return (
    <div
      className={`md:hidden fixed inset-x-0 bottom-0 z-40 bg-[#0D0D0D] transition-transform duration-300 ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
      style={{
        borderTop: "0.5px solid rgba(201,169,110,0.2)",
        paddingBottom: "env(safe-area-inset-bottom, 0)",
      }}
      aria-hidden={!visible}
    >
      <div className="flex items-center gap-3 p-3">
        {/* Thumb */}
        <div className="w-11 h-11 shrink-0 bg-[#F8F5EF] flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt="" className="w-full h-full object-contain p-1" />
          ) : (
            <span className="text-[8px] uppercase tracking-widest text-[#6B6B6B]">
              {product.brand.slice(0, 3)}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-serif text-[13px] text-white truncate leading-tight">
            {product.name}
          </p>
          <p className="text-[13px] text-[#C9A96E] tabular-nums">
            {fmt(product.price)}
          </p>
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="shrink-0 bg-[#C9A96E] text-[#0D0D0D] px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-normal disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {disabled ? "Agotado" : "Agregar"}
        </button>
      </div>
    </div>
  );
}
