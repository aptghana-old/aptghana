"use client";

import { useState, Suspense } from "react";
import FilterSidebar from "./FilterSidebar";
import SearchControls from "./SearchControls";
import ActiveFilters from "./ActiveFilters";

interface Props {
  /** Whether the current results page has any hits */
  hasHits: boolean;
  totalHits: number;
  facets?: Record<string, Record<string, number>>;
  query: string;
  basePath?: string;
  children: React.ReactNode;
}

export default function SearchResultsLayout({
  hasHits, totalHits, facets, query, basePath = "/search", children,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Zero results — no sidebar, no controls; just the ZeroResults component
  if (!hasHits) {
    return <>{children}</>;
  }

  return (
    <div className="flex gap-6 xl:gap-8 items-start">

      {/* Desktop filter sidebar */}
      {sidebarOpen && (
        <aside className="hidden lg:block w-60 xl:w-72 shrink-0 sticky top-24 self-start">
          <div
            className="rounded-2xl p-4"
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
          >
            <Suspense fallback={null}>
              <FilterSidebar facets={facets} basePath={basePath} />
            </Suspense>
          </div>
        </aside>
      )}

      {/* Results column */}
      <div className="flex-1 min-w-0">
        <Suspense fallback={null}>
          <ActiveFilters basePath={basePath} />
        </Suspense>

        <Suspense
          fallback={
            <div
              className="h-10 rounded-xl animate-pulse mb-5"
              style={{ background: "var(--bg-raised)" }}
            />
          }
        >
          <SearchControls
            total={totalHits}
            query={query}
            facets={facets}
            basePath={basePath}
            filtersOpen={sidebarOpen}
            onToggleFilters={() => setSidebarOpen((o) => !o)}
          />
        </Suspense>

        {children}
      </div>
    </div>
  );
}
