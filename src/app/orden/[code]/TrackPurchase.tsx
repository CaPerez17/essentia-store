"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { meta } from "@/lib/meta-pixel";
import { tiktok } from "@/lib/tiktok-pixel";
import { useCartStore } from "@/stores/cart-store";

interface OrderItemLite {
  slug: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
}

interface Props {
  orderId: string;
  total: number;
  items: OrderItemLite[];
  /** Whether to also clear the local cart. True for the post-payment success view. */
  clearCart?: boolean;
}

/**
 * Fires purchase / Purchase / PlaceAnOrder once per order mount, then
 * (optionally) clears the local cart so the user starts fresh.
 *
 * Idempotency: we stash the orderId in sessionStorage. If the user reloads the
 * confirmation page, no duplicate purchase event is fired.
 */
export function TrackPurchase({ orderId, total, items, clearCart = true }: Props) {
  const clear = useCartStore((s) => s.clearCart);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const flagKey = `essentia:purchase-tracked:${orderId}`;
    if (sessionStorage.getItem(flagKey)) return;

    track.purchase(orderId, total, items);
    meta.purchase(orderId, total, items);
    tiktok.purchase(orderId, total, items);

    sessionStorage.setItem(flagKey, "1");
    if (clearCart) clear();
  }, [orderId, total, items, clearCart, clear]);

  return null;
}
