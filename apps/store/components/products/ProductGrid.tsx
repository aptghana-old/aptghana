"use client";

import { useState } from "react";
import ProductCard, {
  type ProductCardData,
  type ProductCardLayout,
  ProductCardSkeleton,
  ProductCardEmpty,
} from "./ProductCard";

/* ─── DB product shape ────────────────────────────────────────────────────── */
export interface DBProduct {
  _id: string;
  name: string;
  slug: string;
  sku?: string;
  mpn?: string;
  brandSlug: string;
  shortDescription?: string;
  images: { main: { url: string; alt?: string } };
  pricing: { listPrice: number; tradePrice?: number; currency: string; minimumOrderQty?: number };
  inventory: { quantity: number };
  isClearance?: boolean;
  isNew?: boolean;
  isFeatured?: boolean;
  discount?: number;
}

export function toProductCardData(p: DBProduct): ProductCardData {
  return {
    id:               p._id,
    name:             p.name,
    slug:             p.slug,
    sku:              p.sku,
    mpn:              p.mpn,
    brandSlug:        p.brandSlug,
    shortDescription: p.shortDescription,
    image:            { url: p.images.main.url, alt: p.images.main.alt },
    pricing: {
      listPrice:       p.pricing.listPrice,
      tradePrice:      p.pricing.tradePrice,
      currency:        p.pricing.currency,
      minimumOrderQty: p.pricing.minimumOrderQty,
    },
    inStock:     (p.inventory.quantity ?? 0) > 0,
    isClearance: p.isClearance,
    isNew:       p.isNew,
    isFeatured:  p.isFeatured,
    discount:    p.discount,
  };
}

/* ─── Layout toggle icons ─────────────────────────────────────────────────── */
function GridIcon({ active }: { active: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <rect x="9" y="1" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <rect x="1" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <rect x="9" y="9" width="6" height="6" rx="1.5" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <rect x="1" y="1" width="4" height="4" rx="1" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <line x1="7" y1="3" x2="15" y2="3" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <rect x="1" y="7" width="4" height="4" rx="1" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <line x1="7" y1="9" x2="15" y2="9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
      <rect x="1" y="13" width="4" height="4" rx="1" stroke="currentColor" strokeWidth={1.5} fill={active ? "currentColor" : "none"} fillOpacity={active ? .15 : 0} />
      <line x1="7" y1="15" x2="15" y2="15" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Layout toggle bar (hidden on mobile, visible on sm+) ───────────────── */
function LayoutToggleBar({
  layout, onChange,
}: {
  layout: ProductCardLayout; onChange: (l: ProductCardLayout) => void;
}) {
  return (
    <div className="hidden sm:flex items-center justify-end gap-1 mb-4">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={layout === "grid"}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
          layout === "grid"
            ? "border-navy-500/40 bg-navy-50 text-navy-500 dark:bg-navy-900/40 dark:text-navy-300"
            : "border-(--border) text-(--text-3) hover:border-navy-300 hover:text-navy-400"
        }`}
      >
        <GridIcon active={layout === "grid"} />
      </button>
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={layout === "list"}
        className={`w-8 h-8 flex items-center justify-center rounded-lg border transition-colors ${
          layout === "list"
            ? "border-navy-500/40 bg-navy-50 text-navy-500 dark:bg-navy-900/40 dark:text-navy-300"
            : "border-(--border) text-(--text-3) hover:border-navy-300 hover:text-navy-400"
        }`}
      >
        <ListIcon active={layout === "list"} />
      </button>
    </div>
  );
}

/* ─── ProductGrid ─────────────────────────────────────────────────────────── */
interface ProductGridProps {
  products:          DBProduct[];
  loading?:          boolean;
  showLayoutToggle?: boolean;
  defaultLayout?:    ProductCardLayout;
}

export default function ProductGrid({
  products,
  loading = false,
  showLayoutToggle = true,
  defaultLayout = "grid",
}: ProductGridProps) {
  const [layout, setLayout] = useState<ProductCardLayout>(defaultLayout);

  const gridCls = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4";

  if (loading) {
    return (
      <div>
        {showLayoutToggle && <LayoutToggleBar layout={layout} onChange={setLayout} />}
        {layout === "grid" ? (
          <div className={gridCls}>
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductCardSkeleton key={i} layout="list" />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div>
        {showLayoutToggle && <LayoutToggleBar layout={layout} onChange={setLayout} />}
        <ProductCardEmpty />
      </div>
    );
  }

  const items = products.map(toProductCardData);

  return (
    <div>
      {showLayoutToggle && <LayoutToggleBar layout={layout} onChange={setLayout} />}

      {layout === "grid" ? (
        <div className={gridCls}>
          {items.map((p) => (
            <ProductCard key={p.id} product={p} layout="grid" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((p) => (
            <ProductCard key={p.id} product={p} layout="list" />
          ))}
        </div>
      )}
    </div>
  );
}
