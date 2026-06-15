"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AutocompleteResult } from "@apt/search";

export interface InstantSearchState {
  query:      string;
  results:    AutocompleteResult | null;
  loading:    boolean;
  error:      boolean;
  setQuery:   (q: string) => void;
  clear:      () => void;
}

const EMPTY: AutocompleteResult = { products: [], brands: [], categories: [] };

export function useInstantSearch(debounceMs = 180): InstantSearchState {
  const [query,   setQueryState] = useState("");
  const [results, setResults]    = useState<AutocompleteResult | null>(null);
  const [loading, setLoading]    = useState(false);
  const [error,   setError]      = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults(null);
      setLoading(false);
      setError(false);
      return;
    }

    setLoading(true);
    setError(false);

    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        const res  = await fetch(
          `/api/search/suggestions?q=${encodeURIComponent(query.trim())}`,
          { signal: ctrl.signal },
        );
        if (!res.ok) throw new Error("search unavailable");
        const data: AutocompleteResult = await res.json();
        setResults(data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError(true);
        setResults(EMPTY);
      } finally {
        setLoading(false);
      }
    }, debounceMs);

    return () => {
      clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [query, debounceMs]);

  const setQuery = useCallback((q: string) => {
    setQueryState(q);
  }, []);

  const clear = useCallback(() => {
    setQueryState("");
    setResults(null);
    setError(false);
  }, []);

  return { query, results, loading, error, setQuery, clear };
}
