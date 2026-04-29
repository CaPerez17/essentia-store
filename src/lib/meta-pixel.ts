/**
 * Meta Pixel (Facebook / Instagram Ads) — typed helpers.
 *
 * The fbevents.js loader is injected by <MetaPixel /> in the root layout.
 * Helpers are no-ops when window.fbq is unavailable.
 */

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

/** Track a Meta standard event (PageView, ViewContent, AddToCart, ...). */
export function fbq(event: string, params?: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  try {
    window.fbq("track", event, params ?? {});
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[meta-pixel] fbq failed:", err);
    }
  }
}

interface ProductLite {
  slug: string;
  name: string;
  brand: string;
  price: number;
}

interface CartLine extends ProductLite {
  quantity: number;
}

export const meta = {
  viewProduct: (p: ProductLite) =>
    fbq("ViewContent", {
      content_ids: [p.slug],
      content_name: p.name,
      content_type: "product",
      content_category: p.brand,
      value: p.price,
      currency: "COP",
    }),

  addToCart: (p: CartLine) =>
    fbq("AddToCart", {
      content_ids: [p.slug],
      content_name: p.name,
      content_type: "product",
      content_category: p.brand,
      value: p.price * p.quantity,
      currency: "COP",
    }),

  initiateCheckout: (total: number, items: CartLine[]) =>
    fbq("InitiateCheckout", {
      content_ids: items.map((i) => i.slug),
      contents: items.map((i) => ({ id: i.slug, quantity: i.quantity })),
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      value: total,
      currency: "COP",
    }),

  purchase: (orderId: string, total: number, items: CartLine[]) =>
    fbq("Purchase", {
      content_ids: items.map((i) => i.slug),
      contents: items.map((i) => ({ id: i.slug, quantity: i.quantity })),
      num_items: items.reduce((s, i) => s + i.quantity, 0),
      value: total,
      currency: "COP",
      order_id: orderId,
    }),

  search: (q: string) => fbq("Search", { search_string: q }),
};
