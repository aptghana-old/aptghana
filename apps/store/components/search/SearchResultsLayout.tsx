"use client";

import { useState, Suspense } from "react";
import FilterSidebar from "./FilterSidebar";
import SearchControls from "./SearchControls";
import ActiveFilters from "./ActiveFilters";
import { LazyMotion, m } from "framer-motion";
const loadFramerMotionFeatures = () =>
  import(/* webpackChunkName: 'lib' */ "../../lib/framer-motion-features").then(
    (mod) => mod.default
  );

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
  const [ sidebarOpen, setSidebarOpen ] = useState(true);

  // Zero results — no sidebar, no controls; just the ZeroResults component
  if (!hasHits) {
    return <>{children}</>;
  }

  return (
    <LazyMotion features={loadFramerMotionFeatures} strict={true}>
      <m.main
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={{
          visible: { opacity: 1 },
          hidden: { opacity: 0 },
        }}
      >
        <div className="flex items-start">

          {/* Desktop filter sidebar */}
          {sidebarOpen && (
            <aside className="hidden lg:block w-72 xl:w-80 shrink-0 sticky top-24 self-start">
              <div
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <Suspense fallback={null}>
                  <FilterSidebar facets={facets} basePath={basePath} />
                </Suspense>
              </div>
            </aside>
          )}

          {/* Results column */}
          <div className="flex-1 min-w-0 py-2.5 border-t border-b pl-1 divide-y" style={{ borderColor: "var(--border)" }}>
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
      </m.main>
    </LazyMotion>
  );
}
