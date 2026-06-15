export interface BrandListItem {
  name: string;
  slug: string;
  country?: string;
  specialty?: string;
  isFeatured?: boolean;
  isPartner?: boolean;
  logoUrl?: string;
  productCount?: number;
}

export interface BrandsPageConfig {
  containerClass: string;
  brandHref: (slug: string) => string;
  rfqHref: string;
  contactHref: string;
}
