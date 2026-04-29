"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { track } from "@/lib/analytics";
import { meta } from "@/lib/meta-pixel";
import { tiktok } from "@/lib/tiktok-pixel";

/**
 * Fires begin_checkout / InitiateCheckout once when /checkout mounts with a
 * non-empty cart. Reads from the Zustand cart store directly (client-side).
 */
export function TrackBeginCheckout() {
  const items = useCartStore((s) => s.items);
  const total = useCartStore((s) => s.getTotal());

  useEffect(() => {
    if (!items.length || total <= 0) return;
    const lines = items.map((i) => ({
      slug: i.slug,
      name: i.name,
      brand: i.brand,
      price: i.price,
      quantity: i.quantity,
    }));
    track.beginCheckout(total, lines);
    meta.initiateCheckout(total, lines);
    tiktok.initiateCheckout(total, lines);
    // Fire-once per mount; if cart changes mid-session we don't re-emit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
