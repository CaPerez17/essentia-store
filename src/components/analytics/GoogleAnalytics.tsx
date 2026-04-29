"use client";

import Script from "next/script";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";

/**
 * Google Analytics 4 loader + SPA pageview tracker.
 *
 * Mounted from the root layout. Returns null when no measurement ID is set
 * (e.g. dev or missing env), so production traffic is the only thing tracked.
 *
 * Uses `next/script` with `afterInteractive` so gtag is queued before the
 * next browser paint without blocking initial render.
 */
export function GoogleAnalytics({ measurementId }: { measurementId?: string }) {
  if (!measurementId) return null;
  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          window.gtag = gtag;
          gtag('js', new Date());
          gtag('config', '${measurementId}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GAPageviewTracker measurementId={measurementId} />
      </Suspense>
    </>
  );
}

/**
 * App-Router pageview tracker — fires `page_view` on every client-side
 * navigation. We disable GA's automatic page_view in `gtag('config', …)`
 * above and emit it ourselves, otherwise SPA navigations are missed.
 */
function GAPageviewTracker({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.gtag !== "function") return;
    const qs = searchParams?.toString();
    const page_path = qs ? `${pathname}?${qs}` : pathname;
    window.gtag("event", "page_view", {
      page_path,
      page_location: window.location.href,
      send_to: measurementId,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
