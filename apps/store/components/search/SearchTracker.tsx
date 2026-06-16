"use client";

import { useEffect } from "react";
import { tracker } from "@/lib/analytics/tracker";

interface Props {
  query: string;
  resultsCount: number;
  durationMs?: number;
  filters?: Record<string, unknown>;
}

export function SearchTracker({ query, resultsCount, durationMs, filters }: Props) {
  useEffect(() => {
    if (query.trim()) {
      tracker.track("search", {
        query: query.trim(),
        resultsCount,
        durationMs,
        filters,
        source: "store",
      });
    }
  // Track once per query/result-set — intentionally no dependency on tracker
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, resultsCount, durationMs]);

  return null;
}
