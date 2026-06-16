"use client";

import { useEffect } from "react";
import { tracker } from "@/lib/analytics/tracker";

/**
 * Logs a `product_view` event. When the visitor arrived from the search
 * results page (detected via `document.referrer`), the originating query is
 * attached so search analytics can attribute the view as a search click —
 * this is the only click signal search analytics has, no separate
 * instrumentation on product cards is needed.
 */
export function ProductViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    let fromQuery: string | undefined;
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (ref && ref.pathname === "/search") {
        fromQuery = ref.searchParams.get("q") ?? undefined;
      }
    } catch { /* ignore malformed referrer */ }

    tracker.track("product_view", { productId, fromQuery });
  }, [productId]);

  return null;
}
