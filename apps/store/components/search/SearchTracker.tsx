"use client";

import { useEffect } from "react";
import { tracker } from "@/lib/analytics/tracker";

export function SearchTracker({ query }: { query: string }) {
  useEffect(() => {
    if (query.trim()) {
      tracker.track("search", { query: query.trim() });
    }
  // Track once per query value — intentionally no dependency on tracker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return null;
}
