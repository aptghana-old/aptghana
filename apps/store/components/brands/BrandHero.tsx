import Link from "next/link";
import type { BrandEntity, BrandCategoryFacet } from "@/lib/brand";
import type { BreadcrumbItem } from "@/lib/catalog";

interface Props {
  brand: BrandEntity;
  breadcrumbs: BreadcrumbItem[];
  categoryFacets: BrandCategoryFacet[];
  productCount: number;
}

export default function BrandHero({ brand, breadcrumbs, categoryFacets, productCount }: Props) {
  const initials = brand.name.slice(0, 3).toUpperCase();

  return (
    <div className="bg-navy-900 text-white">
      {/* Hero band */}
      <div className="container-store pt-5 pb-5 md:pt-8 md:pb-7 relative overflow-hidden">
        {/* Subtle cover image tint */}
        {brand.coverImageUrl && (
          <div
            className="absolute inset-0 opacity-[0.08] bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${brand.coverImageUrl})` }}
            aria-hidden="true"
          />
        )}

        <div className="relative">
          {/* Breadcrumb */}
          <nav
            className="flex items-center gap-1.5 text-[11px] text-white/40 mb-4 flex-wrap"
            aria-label="Breadcrumb"
          >
            {breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-white/20" aria-hidden>
                    /
                  </span>
                )}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-white/70 font-medium" aria-current="page">
                    {crumb.name}
                  </span>
                ) : (
                  <Link href={crumb.href} className="hover:text-white/70 transition-colors">
                    {crumb.name}
                  </Link>
                )}
              </span>
            ))}
          </nav>

          {/* Main row: logo badge + info */}
          <div className="flex items-start gap-3 sm:gap-5">
            {/* Logo badge */}
            <div
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl shrink-0 flex items-center justify-center overflow-hidden"
              style={{ background: "rgba(255,255,255,1)" }}
            >
              {brand.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={brand.logoUrl}
                  alt={`${brand.name} logo`}
                  className="w-full h-full object-contain p-2"
                  loading="eager"
                />
              ) : (
                <span className="text-xs font-black text-[#0a1628] text-center leading-none px-1">
                  {initials}
                </span>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name + count on same row */}
              <div className="flex items-start justify-between gap-3 mb-1">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                    {brand.name}
                  </h1>
                  {brand.isPartner && (
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest shrink-0"
                      style={{
                        background: "rgba(61,205,88,0.15)",
                        border: "1px solid rgba(61,205,88,0.35)",
                        color: "#3DCD58",
                      }}
                    >
                      <span
                        className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full"
                        style={{ background: "#3DCD58" }}
                        aria-hidden
                      />
                      Partner
                    </span>
                  )}
                </div>

                {/* Product count — top-right, compact */}
                {productCount > 0 && (
                  <div className="shrink-0 text-right">
                    <span className="text-lg sm:text-2xl font-bold text-white tabular-nums">
                      {productCount.toLocaleString()}
                    </span>
                    <p className="text-[10px] text-white/40 uppercase tracking-wide font-semibold">
                      Products
                    </p>
                  </div>
                )}
              </div>

              {/* Country, founded, website */}
              <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-[12px] text-white/40 mb-1.5">
                {brand.country && <span>{brand.country}</span>}
                {brand.founded && (
                  <>
                    <span className="text-white/20" aria-hidden>·</span>
                    <span>Est. {brand.founded}</span>
                  </>
                )}
                {brand.website && (
                  <>
                    <span className="text-white/20" aria-hidden>·</span>
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-white/70 transition-colors underline underline-offset-2 truncate max-w-[140px] sm:max-w-none"
                    >
                      {brand.website.replace(/^https?:\/\/(www\.)?/, "")}
                    </a>
                  </>
                )}
              </div>

              {/* Description */}
              {(brand.shortDescription || brand.description) && (
                <p className="text-[12px] sm:text-sm text-white/50 max-w-2xl leading-relaxed line-clamp-2">
                  {brand.shortDescription || brand.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category filter chip strip */}
      {categoryFacets.length > 0 && (
        <div
          className="border-t border-white/[0.06]"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="container-store py-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest shrink-0 pr-1"
                style={{ color: "var(--text-4)" }}
              >
                Browse by:
              </span>
              {categoryFacets.map((facet) => (
                <Link
                  key={facet.name}
                  href={facet.href}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0 transition-all"
                  style={{
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border)",
                    color: "var(--text-2)",
                  }}
                >
                  {facet.name}
                  <span
                    className="text-[10px] font-normal"
                    style={{ color: "var(--text-4)" }}
                  >
                    {facet.count}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
