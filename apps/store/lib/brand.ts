import { connectDB, BrandModel } from "@apt/db";
import { searchProducts } from "@apt/search";
import type { SearchFilters } from "@apt/types";
import type { BreadcrumbItem, SearchSort } from "@/lib/catalog";

export interface BrandEntity {
  name: string;
  slug: string;
  description: string;
  shortDescription: string;
  country: string;
  specialty: string;
  logoUrl: string;
  coverImageUrl: string;
  website: string;
  founded: number | null;
  isPartner: boolean;
  isFeatured: boolean;
  productCount: number;
}

export interface BrandCategoryFacet {
  name: string;
  count: number;
  /** Link to brand page filtered by this category */
  href: string;
}

export interface BrandPageData {
  brand: BrandEntity;
  breadcrumbs: BreadcrumbItem[];
  categoryFacets: BrandCategoryFacet[];
  results: Awaited<ReturnType<typeof searchProducts>> | null;
  error: string | null;
  pageNum: number;
  view: "grid" | "list";
  per: number;
  sort: SearchSort;
  basePath: string;
}

function sp(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

export async function fetchBrandData(
  slug: string,
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<BrandPageData | null> {
  const basePath = `/brands/${slug}`;

  const pageNum = Math.max(1, parseInt(sp(rawSearchParams.page) || "1", 10));
  const perRaw = parseInt(sp(rawSearchParams.per) || "24", 10);
  const per = [12, 24, 48].includes(perRaw) ? perRaw : 24;
  const view = sp(rawSearchParams.view) === "list" ? "list" : "grid";
  const rawSort = sp(rawSearchParams.sort);
  const VALID_SORTS: SearchSort[] = ["relevance", "price_asc", "price_desc", "name_asc"];
  const sort: SearchSort = VALID_SORTS.includes(rawSort as SearchSort)
    ? (rawSort as SearchSort)
    : "relevance";

  try {
    await connectDB();

    const raw = await (BrandModel as any)
      .findOne({ slug, status: "active" })
      .lean();

    if (!raw) return null;

    const breadcrumbs: BreadcrumbItem[] = [
      { name: "Home", href: "/" },
      { name: "Brands", href: "/brands" },
      { name: raw.name, href: basePath },
    ];

    const brand: BrandEntity = {
      name: raw.name,
      slug: raw.slug,
      description: raw.description || "",
      shortDescription: raw.shortDescription || "",
      country: raw.country || "",
      specialty: raw.specialty || "",
      logoUrl: raw.logo?.url ?? "",
      coverImageUrl: raw.coverImage?.url ?? "",
      website: raw.website || "",
      founded: raw.founded ?? null,
      isPartner: raw.isPartner ?? false,
      isFeatured: raw.isFeatured ?? false,
      productCount: raw.productCount ?? 0,
    };

    // Build search filters from URL params
    const userCats = sp(rawSearchParams.cats)
      ? sp(rawSearchParams.cats).split(",").filter(Boolean)
      : [];

    const filters: SearchFilters = {
      brands: [slug],
      categories: userCats.length ? userCats : undefined,
      priceMin: sp(rawSearchParams.pmin)
        ? parseFloat(sp(rawSearchParams.pmin))
        : undefined,
      priceMax: sp(rawSearchParams.pmax)
        ? parseFloat(sp(rawSearchParams.pmax))
        : undefined,
      inStock: sp(rawSearchParams.instock) === "1" ? true : undefined,
      isClearance: sp(rawSearchParams.clearance) === "1" ? true : undefined,
      specs: sp(rawSearchParams.specs)
        ? sp(rawSearchParams.specs).split(",").filter(Boolean)
        : undefined,
    };

    const q = sp(rawSearchParams.q).trim();
    let results: Awaited<ReturnType<typeof searchProducts>> | null = null;
    let error: string | null = null;

    try {
      results = await searchProducts(q, filters, pageNum, per, sort);
    } catch {
      error = "Product search is temporarily unavailable.";
    }

    // Extract lvl1 category facets — most useful for a brand-scoped page
    const facetLvl1 = results?.facets?.["hierarchicalCategories.lvl1"] ?? {};
    const categoryFacets: BrandCategoryFacet[] = Object.entries(facetLvl1)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 12)
      .map(([name, count]) => ({
        name,
        count: count as number,
        href: `${basePath}?cats=${encodeURIComponent(name)}`,
      }));

    return {
      brand,
      breadcrumbs,
      categoryFacets,
      results,
      error,
      pageNum,
      view,
      per,
      sort,
      basePath,
    };
  } catch {
    return null;
  }
}
