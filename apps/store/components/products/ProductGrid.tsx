"use client";

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

/* ─── ProductGrid ─────────────────────────────────────────────────────────── */
interface ProductGridProps {
  products:          DBProduct[];
  loading?:          boolean;
  /** @deprecated list view has been removed — ignored */
  showLayoutToggle?: boolean;
  /** @deprecated list view has been removed — ignored */
  defaultLayout?:    ProductCardLayout;
}

export default function ProductGrid({
  products,
  loading = false,
}: ProductGridProps) {
  const gridCls = "grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4";

  if (loading) {
    return (
      <div className={gridCls}>
        {Array.from({ length: 12 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return <ProductCardEmpty />;
  }

  return (
    <div className={gridCls}>
      {products.map(toProductCardData).map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
