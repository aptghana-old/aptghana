import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { STORE_URL } from "@apt/config";
import { Suspense } from "react";
import { fetchBrandData } from "@/lib/brand";
import BrandHero from "@/components/brands/BrandHero";
import BrowseLayout from "@/components/search/BrowseLayout";
import SearchPagination from "@/components/search/SearchPagination";
import ProductCard, { type ProductCardData } from "@/components/products/ProductCard";
import ZeroResults from "@/components/search/ZeroResults";
import type { ProductSearchHit } from "@apt/search";

// ─── Helpers (same pattern as CatalogBrowse) ─────────────────────────────────

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
    brandImage: hit.brandLogoUrl,
    filterTags: hit.filterTags ?? [],
  };
}

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
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {hits.map((hit) => (
        <ProductCard key={hit.id} product={hitToCard(hit)} layout="grid" />
      ))}
    </div>
  );
}

function SkeletonGrid({ view }: { view: string }) {
  if (view === "list") {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl animate-pulse"
            style={{ background: "var(--bg-raised)" }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-[3/4] rounded-2xl animate-pulse"
          style={{ background: "var(--bg-raised)" }}
        />
      ))}
    </div>
  );
}

// ─── Metadata ────────────────────────────────────────────────────────────────

export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const name = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return {
    title: `${name} Products | APT Ghana`,
    description: `Browse genuine ${name} industrial products from APT Ghana — authorized distributor for West Africa.`,
    alternates: { canonical: `${STORE_URL}/brands/${slug}` },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const data = await fetchBrandData(slug, sp);
  if (!data) notFound();

  const { brand, breadcrumbs, categoryFacets, results, error, pageNum, view, basePath } = data;
  const totalHits = results?.totalHits ?? 0;
  const totalPages = results?.totalPages ?? 0;
  const facets = results?.facets;

  return (
    <>
      <BrandHero
        brand={brand}
        breadcrumbs={breadcrumbs}
        categoryFacets={categoryFacets}
        productCount={totalHits > 0 ? totalHits : brand.productCount}
      />

      <main className="container-store py-6 md:py-8 flex-1">
        {/* Error banner */}
        {error && (
          <div
            className="flex items-start gap-3 p-4 rounded-xl text-sm mb-6"
            style={{
              background: "#fef3c7",
              border: "1px solid #fcd34d",
              color: "#92400e",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        <BrowseLayout totalHits={totalHits} facets={facets} query="" basePath={basePath}>
          {results && results.hits.length > 0 && (
            <ResultsGrid hits={results.hits} view={view} />
          )}

          {results && results.hits.length === 0 && !error && (
            <ZeroResults query={brand.name} />
          )}

          {!results && !error && <SkeletonGrid view={view} />}

          {results && totalPages > 1 && (
            <Suspense fallback={null}>
              <SearchPagination
                totalPages={totalPages}
                currentPage={pageNum}
                basePath={basePath}
              />
            </Suspense>
          )}

          {results && results.processingTimeMs > 0 && (
            <p
              className="text-center text-[11px] mt-4"
              style={{ color: "var(--text-4)" }}
            >
              {totalHits.toLocaleString()} products in {results.processingTimeMs}ms
            </p>
          )}
        </BrowseLayout>
      </main>
    </>
  );
}
