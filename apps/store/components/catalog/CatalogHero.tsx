import Link from "next/link";
import type { BreadcrumbItem, CatalogChild } from "@/lib/catalog";

interface Props {
  name: string;
  description?: string;
  image?: string;
  productCount?: number;
  breadcrumbs: BreadcrumbItem[];
  children: CatalogChild[];
  accentColor?: string;
}

export default function CatalogHero({
  name,
  description,
  image,
  productCount,
  breadcrumbs,
  children,
  accentColor = "#3DCD58",
}: Props) {
  return (
    <div className="bg-navy-900 text-white">
      {/* Hero band */}
      <div className="container-store pt-5 pb-5 md:pt-8 md:pb-7 relative overflow-hidden">
        {/* Subtle bg tint from image */}
        {image && (
          <div
            className="absolute inset-0 opacity-[0.08] bg-cover bg-center pointer-events-none"
            style={{ backgroundImage: `url(${image})` }}
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

          {/* Title row */}
          <div className="flex items-end gap-5 flex-wrap">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">{name}</h1>
              {description && (
                <p className="mt-2 text-sm text-white/50 max-w-2xl leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            {productCount !== undefined && productCount > 0 && (
              <div className="shrink-0 text-right">
                <span className="text-2xl font-bold text-white">
                  {productCount.toLocaleString()}
                </span>
                <p className="text-[11px] text-white/40 uppercase tracking-wide font-semibold mt-0.5">
                  Products
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Child navigation cards */}
      {children.length > 0 && (
        <div
          className="border-t border-white/[0.06]"
          style={{ background: "var(--bg-base)" }}
        >
          <div className="container-store py-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
              {children.map((child) => (
                <Link
                  key={child.slug}
                  href={child.href}
                  className="group flex flex-col gap-2 p-2.5 sm:p-3.5 rounded-xl transition-all border hover:shadow-[var(--shadow-2)] hover:border-[var(--border-hi)]"
                  style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
                >
                  {/* Thumbnail */}
                  <div
                    className="w-full aspect-[4/3] rounded-lg overflow-hidden flex items-center justify-center shrink-0"
                    style={{ background: accentColor + "12" }}
                  >
                    {child.image ? (
                      <img
                        src={child.image}
                        alt={child.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-10 h-10 rounded-lg opacity-25"
                        style={{ background: accentColor }}
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-semibold leading-snug line-clamp-2 transition-colors group-hover:text-navy-500 dark:group-hover:text-navy-300"
                      style={{ color: "var(--text-1)" }}
                    >
                      {child.name}
                    </p>
                    {child.description && (
                      <p
                        className="text-[11px] mt-0.5 line-clamp-2 leading-relaxed"
                        style={{ color: "var(--text-3)" }}
                      >
                        {child.description}
                      </p>
                    )}
                    {child.productCount > 0 && (
                      <p
                        className="text-[10px] font-semibold mt-1.5 uppercase tracking-wide"
                        style={{ color: "var(--text-4)" }}
                      >
                        {child.productCount.toLocaleString()} products
                      </p>
                    )}
                  </div>

                  <div className="flex items-center text-[11px] font-semibold text-navy-500 dark:text-navy-300 group-hover:gap-2 gap-1.5 transition-all">
                    Browse
                    <svg
                      width={10}
                      height={10}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
