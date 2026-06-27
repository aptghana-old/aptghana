import { Suspense } from "react";
import CatalogHero from "./CatalogHero";
import BrowseLayout from "@/components/search/BrowseLayout";
import SearchPagination from "@/components/search/SearchPagination";
import ProductCard, { type ProductCardData } from "@/components/products/ProductCard";
import ZeroResults from "@/components/search/ZeroResults";
import type { CatalogPageData, BreadcrumbItem } from "@/lib/catalog";
import type { ProductSearchHit } from "@apt/search";
import { STORE_URL } from "@apt/config";
import { safeJsonLd } from "@apt/auth";

function breadcrumbListLd(breadcrumbs: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: b.name,
      item: `${STORE_URL}${b.href}`,
    })),
  };
}

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
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
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
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
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

interface Props {
  data: CatalogPageData;
}

export default function CatalogBrowse({ data }: Props) {
  const { entity, breadcrumbs, children, results, error, pageNum, view, basePath } = data;
  const totalHits = results?.totalHits ?? 0;
  const totalPages = results?.totalPages ?? 0;
  const facets = results?.facets;
  const accentColor = "#3DCD58";

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbListLd(breadcrumbs)) }} />
      <CatalogHero
        name={entity.name}
        description={entity.description || entity.shortDescription}
        image={entity.image}
        productCount={totalHits > 0 ? totalHits : undefined}
        breadcrumbs={breadcrumbs}
        // eslint-disable-next-line react/no-children-prop
        children={children}
        accentColor={accentColor}
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
            <ZeroResults query="" />
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
