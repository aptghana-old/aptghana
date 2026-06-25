"use client";

import { useState, Suspense } from "react";
import FilterSidebar from "./FilterSidebar";
import SearchControls from "./SearchControls";
import ActiveFilters from "./ActiveFilters";

interface Props {
  totalHits: number;
  facets?: Record<string, Record<string, number>>;
  query?: string;
  basePath?: string;
  children: React.ReactNode;
}

export default function BrowseLayout({ totalHits, facets, query = "", basePath = "/search", children }: Props) {
  const [ sidebarOpen, setSidebarOpen ] = useState(true);

  return (
    <div className="flex gap-8 items-start">
      {sidebarOpen && (
        <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
          <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
            <Suspense fallback={null}>
              <FilterSidebar facets={facets} basePath={basePath} />
            </Suspense>
          </div>
        </aside>
      )}

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
