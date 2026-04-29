"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { meta } from "@/lib/meta-pixel";
import { tiktok } from "@/lib/tiktok-pixel";

interface Props {
  slug: string;
  name: string;
  brand: string;
  price: number;
}

/**
 * Fires view_item / ViewContent across GA4, Meta Pixel, and TikTok Pixel
 * exactly once when a PDP mounts. Cheap, no-op if pixels aren't loaded.
 */
export function TrackProductView(product: Props) {
  useEffect(() => {
    track.viewProduct(product);
    meta.viewProduct(product);
    tiktok.viewProduct(product);
    // intentionally no deps — fire once per mount (once per slug navigation)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
