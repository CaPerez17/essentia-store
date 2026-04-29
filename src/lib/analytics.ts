/**
 * Google Analytics 4 — typed helpers for client-side event tracking.
 *
 * The gtag.js script is injected by <GoogleAnalytics /> in the root layout.
 * These helpers are no-ops when window.gtag is unavailable (SSR, dev without
 * NEXT_PUBLIC_GA_MEASUREMENT_ID, ad-blocker, etc.) so they never throw.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export function trackEvent(
  name: string,
  params?: Record<string, unknown>,
): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", name, params ?? {});
  } catch (err) {
    // never throw from analytics
    if (process.env.NODE_ENV !== "production") {
      console.warn("[ga4] trackEvent failed:", err);
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

export const track = {
  viewProduct: (product: ProductLite) =>
    trackEvent("view_item", {
      currency: "COP",
      value: product.price,
      items: [
        {
          item_id: product.slug,
          item_name: product.name,
          item_brand: product.brand,
          price: product.price,
        },
      ],
    }),

  addToCart: (product: CartLine) =>
    trackEvent("add_to_cart", {
      currency: "COP",
      value: product.price * product.quantity,
      items: [
        {
          item_id: product.slug,
          item_name: product.name,
          item_brand: product.brand,
          price: product.price,
          quantity: product.quantity,
        },
      ],
    }),

  beginCheckout: (total: number, items: CartLine[]) =>
    trackEvent("begin_checkout", {
      currency: "COP",
      value: total,
      items: items.map((i) => ({
        item_id: i.slug,
        item_name: i.name,
        item_brand: i.brand,
        price: i.price,
        quantity: i.quantity,
      })),
    }),

  purchase: (orderId: string, total: number, items: CartLine[]) =>
    trackEvent("purchase", {
      transaction_id: orderId,
      currency: "COP",
      value: total,
      items: items.map((i) => ({
        item_id: i.slug,
        item_name: i.name,
        item_brand: i.brand,
        price: i.price,
        quantity: i.quantity,
      })),
    }),

  searchQuery: (query: string) =>
    trackEvent("search", { search_term: query }),

  viewBrand: (brand: string) =>
    trackEvent("view_item_list", { item_list_name: brand }),

  quizComplete: (profile: string) =>
    trackEvent("quiz_complete", { olfactory_profile: profile }),

  dupeFinder: (query: string) =>
    trackEvent("dupe_finder_search", { search_term: query }),
};
