"use client";

import {
  createContext, useContext, useMemo, useState, useEffect,
  type ReactNode,
} from "react";
import type { ProductFull } from "@/components/products/ProductDetail";
import type {
  ProductContextShape, ProductImage, ActiveMedia, RecentlyViewedProduct, VideoItem,
} from "@/types/product";

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

/** Attempt to derive a hi-res URL from CDN image URLs (Cloudinary / similar). */
function toHiRes(url: string): string {
  if (!url) return url;
  // Cloudinary: swap upload transforms for w_2000,q_auto,f_auto
  if (url.includes("/upload/")) {
    return url.replace(/\/upload\/[^/]+\//, "/upload/w_2000,q_auto,f_auto/");
  }
  return url;
}

function mapProductFull(p: ProductFull): ProductContextShape {
  const mainImage: ProductImage = {
    preview: p.images.main?.url ?? "",
    zoomed: toHiRes(p.images.main?.url ?? ""),
    alt: p.images.main?.alt,
  };

  const galleryImages: ProductImage[] = (p.images.gallery ?? []).map((g) => ({
    preview: g.url,
    zoomed: toHiRes(g.url),
    alt: g.alt,
  }));

  const cadDoc = p.documents?.find((d) => d.type === "cad");

  const videos: VideoItem[] | undefined =
    p.videos && p.videos.length > 0 ? p.videos : undefined;

  const brandName =
    p.brand?.name ??
    p.brandSlug
      .split("-")
      .map((w) => w[0].toUpperCase() + w.slice(1))
      .join(" ");

  return {
    name: p.name,
    sku: p.sku,
    supplierRef: p.supplierRef,
    brand: brandName,
    image: mainImage,
    alternativeImages: galleryImages.length > 0 ? galleryImages : undefined,
    cadUrl: cadDoc?.url,
    videos,
  };
}

const LS_KEY = "apt-recently-viewed";

function persistRecentlyViewed(entry: RecentlyViewedProduct) {
  try {
    const stored = JSON.parse(localStorage.getItem(LS_KEY) ?? "[]") as RecentlyViewedProduct[];
    const deduped = stored.filter((s) => s.sku !== entry.sku);
    localStorage.setItem(LS_KEY, JSON.stringify([entry, ...deduped].slice(0, 20)));
  } catch { /* storage unavailable */ }
}

/* ─── Context ─────────────────────────────────────────────────────────────── */

interface ProductContextValue {
  product: ProductContextShape;
  active: ActiveMedia;
  modal: boolean;
  zoomed: boolean;
  updateActive: (active: ActiveMedia) => void;
  updateModal: (value: boolean) => void;
  updateZoom: (value: boolean) => void;
  updateProduct: (product: ProductContextShape) => void;
}

const ProductContext = createContext<ProductContextValue | undefined>(undefined);

/* ─── Provider ────────────────────────────────────────────────────────────── */

export function ProductProvider({
  children,
  product: raw,
}: {
  children: ReactNode;
  product: ProductFull;
}) {
  const initial = useMemo(() => mapProductFull(raw), [raw]);

  const [product, setProduct] = useState<ProductContextShape>(initial);
  const [active, setActive] = useState<ActiveMedia>({
    item: initial.image.preview,
    type: "image",
  });
  const [modal, setModal] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    persistRecentlyViewed({
      image: { preview: product.image.preview },
      supplierRef: product.supplierRef,
      description: product.name,
      sku: product.sku,
    });
  }, [product.sku, product.image.preview, product.supplierRef, product.name]);

  const value = useMemo(
    () => ({
      product,
      active,
      modal,
      zoomed,
      updateProduct: setProduct,
      updateActive: setActive,
      updateModal: setModal,
      updateZoom: setZoomed,
    }),
    [product, active, modal, zoomed]
  );

  return (
    <ProductContext.Provider value={value}>{children}</ProductContext.Provider>
  );
}

export function useProduct() {
  const ctx = useContext(ProductContext);
  if (!ctx) throw new Error("useProduct must be used within a ProductProvider");
  return ctx;
}
