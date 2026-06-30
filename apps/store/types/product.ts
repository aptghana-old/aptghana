/** Slim image shape shared between context and ImageZoomClick */
export interface ProductImage {
  preview: string;
  zoomed?: string;
  alt?: string;
}

export type ProductImageType = ProductImage;

export interface VideoItem {
  title: string;
  url: string;
  thumbnail?: string;
}

/** Context-facing product shape — mapped from ProductFull by ProductProvider */
export interface ProductContextShape {
  name: string;
  sku: string;
  supplierRef?: string;
  brand?: string;
  image: ProductImage;
  alternativeImages?: ProductImage[];
  cadUrl?: string;
  videos?: VideoItem[];
}

export type ActiveMedia = {
  item: string;
  type: "image" | "cad" | "video";
};

export interface RecentlyViewedProduct {
  image: { preview: string };
  supplierRef?: string;
  description: string;
  sku: string;
}
