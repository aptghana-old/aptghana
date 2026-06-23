import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchTracker } from "@/components/search/SearchTracker";
import { searchProducts, type ProductSearchHit, type SearchSort } from "@apt/search";
import type { SearchFilters } from "@apt/types";
import ProductCard, { type ProductCardData } from "@/components/products/ProductCard";
import FilterSidebar from "@/components/search/FilterSidebar";
import ActiveFilters from "@/components/search/ActiveFilters";
import SearchControls from "@/components/search/SearchControls";
import SearchPagination from "@/components/search/SearchPagination";
import ZeroResults from "@/components/search/ZeroResults";

/* ─── Types ───────────────────────────────────────────────────────────────── */
interface SearchPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function sp(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[ 0 ] ?? "" : v ?? "";
}

/* ─── Metadata ────────────────────────────────────────────────────────────── */
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const p = await searchParams;
  const q = sp(p.q);
  return {
    title: q ? `Search: "${q}" — APT Ghana` : "Product Search — APT Ghana",
    description: q
      ? `Search results for "${q}" — industrial automation products from APT Ghana.`
      : "Search APT Ghana's catalogue of 6,000+ industrial automation products.",
  };
}

/* ─── Hit → card ──────────────────────────────────────────────────────────── */
function hitToCard(hit: ProductSearchHit): ProductCardData {
  return {
    id: hit.id,
    name: hit.name,
    slug: hit.sku.toLowerCase(),
    sku: hit.sku,
    mpn: hit.mpn,
    brandSlug: hit.brandSlug,
    brandName: hit.brandName,
    shortDescription: hit.shortDescription,
    image: { url: hit.imageUrl ?? "", alt: hit.name },
    pricing: { listPrice: hit.listPrice, currency: hit.currency },
    inStock: hit.inStock,
    isClearance: hit.isClearance,
    discount: hit.discount,
  };
}

/* ─── Breadcrumb ──────────────────────────────────────────────────────────── */
function Breadcrumb({ query }: { query: string }) {
  return (
    <nav className="flex items-center gap-1.5 text-[12px] text-(--text-4) mb-4" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-(--text-2) transition-colors">Home</Link>
      <span>/</span>
      <Link href="/catalog" className="hover:text-(--text-2) transition-colors">Catalog</Link>
      <span>/</span>
      <span className="text-(--text-2) font-medium truncate max-w-[200px]">
        {query ? `"${query}"` : "Search"}
      </span>
    </nav>
  );
}

/* ─── Result grid ─────────────────────────────────────────────────────────── */
function ResultsGrid({ hits, view }: { hits: ProductSearchHit[]; view: string }) {
  if (view === "list") {
    return (
      <div className="space-y-3">
        {hits.map((hit) => (
          <ProductCard key={hit.id} product={hitToCard(hit)} layout="list" />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {hits.map((hit) => (
        <ProductCard key={hit.id} product={hitToCard(hit)} layout="grid" />
      ))}
    </div>
  );
}

/* ─── Skeleton rows ───────────────────────────────────────────────────────── */
function SkeletonGrid({ view }: { view: string }) {
  if (view === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: "var(--bg-raised)" }} />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="aspect-[3/4] rounded-2xl animate-pulse" style={{ background: "var(--bg-raised)" }} />
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function SearchPage({ searchParams }: SearchPageProps) {
  const p = await searchParams;

  const q = sp(p.q).trim();
  const pageNum = Math.max(1, parseInt(sp(p.page) || "1", 10));
  const per = [ 12, 24, 48 ].includes(parseInt(sp(p.per) || "24", 10)) ? parseInt(sp(p.per) || "24", 10) : 24;
  const view = sp(p.view) === "list" ? "list" : "grid";
  const rawSort = sp(p.sort);
  const sort: SearchSort = ([ "relevance", "price_asc", "price_desc", "name_asc" ] as SearchSort[]).includes(rawSort as SearchSort)
    ? rawSort as SearchSort
    : "relevance";

  const filters: SearchFilters = {
    brands: sp(p.brands) ? sp(p.brands).split(",").filter(Boolean) : undefined,
    categories: sp(p.cats) ? sp(p.cats).split(",").filter(Boolean) : undefined,
    priceMin: sp(p.pmin) ? parseFloat(sp(p.pmin)) : undefined,
    priceMax: sp(p.pmax) ? parseFloat(sp(p.pmax)) : undefined,
    inStock: sp(p.instock) === "1" ? true : undefined,
    isClearance: sp(p.clearance) === "1" ? true : undefined,
    specs: sp(p.specs) ? sp(p.specs).split(",").filter(Boolean) : undefined,
  };

  let results: Awaited<ReturnType<typeof searchProducts>> | null = null;
  let error: string | null = null;

  if (q || filters.brands?.length || filters.categories?.length || filters.inStock || filters.isClearance || filters.specs?.length) {
    try {
      results = await searchProducts(q, filters, pageNum, per, sort);
    } catch {
      error = "Search is temporarily unavailable. Please try again shortly.";
    }
  }

  const totalHits = results?.totalHits ?? 0;
  const totalPages = results?.totalPages ?? 0;
  const facets = results?.facets;

  return (
    <>
      {q && results && (
        <SearchTracker
          query={q}
          resultsCount={totalHits}
          durationMs={results.processingTimeMs}
          filters={{ brands: filters.brands, categories: filters.categories, inStock: filters.inStock, isClearance: filters.isClearance }}
        />
      )}

      <main className="container-store py-6 md:py-8 flex-1">
        <Breadcrumb query={q} />

        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl text-sm mb-6"
            style={{ background: "#fef3c7", border: "1px solid #fcd34d", color: "#92400e" }}
            role="alert"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5" aria-hidden>
              <path d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            {error}
          </div>
        )}

        {/* Empty state — no query */}
        {!q && !error && !filters.brands?.length && !filters.categories?.length && !filters.inStock && !filters.isClearance && (
          <div className="py-16 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--bg-raised)" }}>
              <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-(--text-4)" aria-hidden>
                <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-(--text-1) mb-2">Search our catalogue</h1>
            <p className="text-[14px] text-(--text-3) max-w-sm mx-auto">
              Enter a product name, part number, SKU, or brand to search 6,000+ industrial automation products.
            </p>
          </div>
        )}

        {/* Main layout: sidebar + results */}
        {(results || error) && (
          <div className="flex gap-8 items-start">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-64 xl:w-72 shrink-0 sticky top-24 self-start">
              <div
                className="rounded-2xl p-4"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <Suspense fallback={null}>
                  <FilterSidebar facets={facets} />
                </Suspense>
              </div>
            </aside>

            {/* Results column */}
            <div className="flex-1 min-w-0">
              <Suspense fallback={null}>
                <ActiveFilters />
              </Suspense>

              <Suspense fallback={<div className="h-10 rounded-xl animate-pulse mb-5" style={{ background: "var(--bg-raised)" }} />}>
                <SearchControls total={totalHits} query={q} facets={facets} />
              </Suspense>

              {/* Hits */}
              {results && results.hits.length > 0 && (
                <ResultsGrid hits={results.hits} view={view} />
              )}

              {/* Zero results */}
              {results && results.hits.length === 0 && !error && (
                <ZeroResults query={q} />
              )}

              {/* Skeleton while loading (handled by loading.tsx Suspense) */}
              {!results && !error && <SkeletonGrid view={view} />}

              {/* Pagination */}
              {results && totalPages > 1 && (
                <Suspense fallback={null}>
                  <SearchPagination totalPages={totalPages} currentPage={pageNum} />
                </Suspense>
              )}

              {/* Performance note */}
              {results && results.processingTimeMs > 0 && (
                <p className="text-center text-[11px] text-(--text-4) mt-4">
                  {totalHits.toLocaleString()} results in {results.processingTimeMs}ms
                </p>
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
