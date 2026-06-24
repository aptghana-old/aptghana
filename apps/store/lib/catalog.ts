import { connectDB, CategoryModel } from "@apt/db";
import { searchProducts } from "@apt/search";
import type { SearchFilters } from "@apt/types";

export type SearchSort = "relevance" | "price_asc" | "price_desc" | "name_asc";

export interface CatalogEntity {
  name: string;
  slug: string;
  level: string;
  description: string;
  shortDescription: string;
  image: string;
  productCount: number;
}

export interface CatalogChild {
  name: string;
  slug: string;
  href: string;
  image: string;
  description: string;
  productCount: number;
}

export interface BreadcrumbItem {
  name: string;
  href: string;
}

export interface CatalogPageData {
  entity: CatalogEntity;
  breadcrumbs: BreadcrumbItem[];
  children: CatalogChild[];
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

export async function fetchCatalogData(
  slugs: string[],
  rawSearchParams: Record<string, string | string[] | undefined>,
): Promise<CatalogPageData | null> {
  const leafSlug = slugs[slugs.length - 1];
  const basePath = "/catalog/" + slugs.join("/");

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

    const raw = await (CategoryModel as any)
      .findOne({ slug: leafSlug, status: "active" })
      .populate({ path: "ancestors", select: "slug name level" })
      .lean();

    if (!raw) return null;

    // Build breadcrumbs from populated ancestors + current entity
    const ancestors: { slug: string; name: string }[] = Array.isArray(raw.ancestors)
      ? raw.ancestors
      : [];
    const breadcrumbs: BreadcrumbItem[] = [
      { name: "Home", href: "/" },
      { name: "Catalogue", href: "/catalog" },
      ...ancestors.map((a, i) => ({
        name: a.name,
        href: "/catalog/" + ancestors.slice(0, i + 1).map((x) => x.slug).join("/"),
      })),
      { name: raw.name, href: basePath },
    ];

    // Fetch direct children
    const rawChildren = await (CategoryModel as any)
      .find({ parentId: raw._id, status: "active" })
      .select("name slug shortDescription description image productCount")
      .sort({ displayOrder: 1 })
      .lean();

    const children: CatalogChild[] = (rawChildren as any[]).map((c: any) => ({
      name: c.name,
      slug: c.slug,
      href: `${basePath}/${c.slug}`,
      image: c.image?.url ?? "",
      description: c.shortDescription || c.description || "",
      productCount: c.productCount ?? 0,
    }));

    // Build search filters from URL params
    // User-selected category refinements (from facet sidebar) take precedence over the locked entity.
    // This allows drilling into a subcategory while still on the group page.
    const userCats = sp(rawSearchParams.cats)
      ? sp(rawSearchParams.cats).split(",").filter(Boolean)
      : [];
    const filters: SearchFilters = {
      categories: userCats.length ? userCats : [raw.name],
      brands: sp(rawSearchParams.brands)
        ? sp(rawSearchParams.brands).split(",").filter(Boolean)
        : undefined,
      priceMin: sp(rawSearchParams.pmin)
        ? parseFloat(sp(rawSearchParams.pmin))
        : undefined,
      priceMax: sp(rawSearchParams.pmax)
        ? parseFloat(sp(rawSearchParams.pmax))
        : undefined,
      inStock: sp(rawSearchParams.instock) === "1" ? true : undefined,
      isClearance: sp(rawSearchParams.clearance) === "1" ? true : undefined,
      specs: sp(rawSearchParams.specs) ? sp(rawSearchParams.specs).split(",").filter(Boolean) : undefined,
    };

    const q = sp(rawSearchParams.q).trim();
    let results: Awaited<ReturnType<typeof searchProducts>> | null = null;
    let error: string | null = null;

    try {
      results = await searchProducts(q, filters, pageNum, per);
    } catch {
      error = "Product search is temporarily unavailable.";
    }

    const entity: CatalogEntity = {
      name: raw.name,
      slug: raw.slug,
      level: raw.level,
      description: raw.description || "",
      shortDescription: raw.shortDescription || "",
      image: raw.image?.url ?? "",
      productCount: results?.totalHits ?? raw.productCount ?? 0,
    };

    return {
      entity,
      breadcrumbs,
      children,
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
