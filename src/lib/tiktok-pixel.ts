/**
 * TikTok Pixel — typed helpers.
 *
 * The pixel loader is injected by <TikTokPixel /> in the root layout.
 * Helpers are no-ops when window.ttq is unavailable.
 */

interface TtqLike {
  page?: () => void;
  track?: (event: string, params?: Record<string, unknown>) => void;
  load?: (id: string) => void;
}

declare global {
  interface Window {
    ttq?: TtqLike;
    TiktokAnalyticsObject?: string;
  }
}

export function ttq(
  event: string,
  params?: Record<string, unknown>,
): void {
  if (
    typeof window === "undefined" ||
    !window.ttq ||
    typeof window.ttq.track !== "function"
  ) {
    return;
  }
  try {
    window.ttq.track(event, params ?? {});
  } catch (err) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tiktok-pixel] ttq failed:", err);
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

export const tiktok = {
  viewProduct: (p: ProductLite) =>
    ttq("ViewContent", {
      contents: [
        {
          content_id: p.slug,
          content_name: p.name,
          content_category: p.brand,
          quantity: 1,
          price: p.price,
        },
      ],
      value: p.price,
      currency: "COP",
    }),

  addToCart: (p: CartLine) =>
    ttq("AddToCart", {
      contents: [
        {
          content_id: p.slug,
          content_name: p.name,
          content_category: p.brand,
          quantity: p.quantity,
          price: p.price,
        },
      ],
      value: p.price * p.quantity,
      currency: "COP",
    }),

  initiateCheckout: (total: number, items: CartLine[]) =>
    ttq("InitiateCheckout", {
      contents: items.map((i) => ({
        content_id: i.slug,
        content_name: i.name,
        content_category: i.brand,
        quantity: i.quantity,
        price: i.price,
      })),
      value: total,
      currency: "COP",
    }),

  purchase: (orderId: string, total: number, items: CartLine[]) =>
    ttq("PlaceAnOrder", {
      contents: items.map((i) => ({
        content_id: i.slug,
        content_name: i.name,
        content_category: i.brand,
        quantity: i.quantity,
        price: i.price,
      })),
      value: total,
      currency: "COP",
      order_id: orderId,
    }),

  search: (q: string) => ttq("Search", { query: q }),
};
