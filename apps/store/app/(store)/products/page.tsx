import type { Metadata } from "next";
import { connectDB, ProductModel, CategoryModel, BrandModel } from "@apt/db";
import ProductGrid from "@/components/products/ProductGrid";
import FilterPanel from "@/components/products/FilterPanel";
import SortSelect from "@/components/products/SortSelect";

interface SearchParams {
  q?: string;
  brand?: string;
  category?: string;
  min?: string;
  max?: string;
  sort?: string;
  page?: string;
  inStock?: string;
  clearance?: string;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const params = await searchParams;
  const q = params.q;
  return {
    title: q ? `"${q}" — Search Results` : "All Industrial Products",
    description: "Browse 6,000+ industrial products from 26+ global brands. Filter by brand, category, and more.",
  };
}

interface ProductLean {
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

interface BrandLean { slug: string; name: string }
interface CategoryLean { slug: string; name: string; level: string; _id: string }

const PAGE_SIZE = 24;

async function getProducts(params: SearchParams) {
  await connectDB();

  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const skip = (page - 1) * PAGE_SIZE;

  const filter: Record<string, unknown> = { status: "active" };
  if (params.brand) filter.brandSlug = params.brand;
  if (params.inStock === "true") filter["inventory.quantity"] = { $gt: 0 };
  if (params.clearance === "true") filter.isClearance = true;
  if (params.min || params.max) {
    filter["pricing.listPrice"] = {
      ...(params.min ? { $gte: parseFloat(params.min) } : {}),
      ...(params.max ? { $lte: parseFloat(params.max) } : {}),
    };
  }

  const sortMap: Record<string, Record<string, number>> = {
    "price-asc":  { "pricing.listPrice": 1 },
    "price-desc": { "pricing.listPrice": -1 },
    "newest":     { createdAt: -1 },
    "popular":    { views: -1 },
    "relevance":  { relevanceScore: -1 },
  };
  const sort = sortMap[params.sort ?? "relevance"] ?? sortMap["relevance"]!;

  const [rawProducts, total, rawBrands, rawCategories] = await Promise.all([
    ProductModel.find(filter)
      .select("name slug sku mpn brandSlug shortDescription images pricing inventory isClearance isNew isFeatured discount")
      .sort(sort as Record<string, 1 | -1>)
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    ProductModel.countDocuments(filter),
    BrandModel.find({ status: "active" }).select("slug name -_id").sort({ name: 1 }).lean(),
    CategoryModel.find({ status: "active", level: "category" }).select("slug name level").lean(),
  ]);

  // Serialize to plain objects so client components receive no ObjectIds
  const products: ProductLean[] = (rawProducts as unknown[]).map((p: unknown) => JSON.parse(JSON.stringify(p)));
  const brands: BrandLean[] = (rawBrands as unknown[]).map((b: unknown) => JSON.parse(JSON.stringify(b)));
  const categories: CategoryLean[] = (rawCategories as unknown[]).map((c: unknown) => JSON.parse(JSON.stringify(c)));

  return { products, total, page, brands, categories };
}

export const revalidate = 300;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;

  let data: Awaited<ReturnType<typeof getProducts>> | null = null;
  try {
    data = await getProducts(params);
  } catch {
    data = null;
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <>      <main className="container-store py-6 flex-1">
        {/* Breadcrumb */}
        <nav className="text-sm text-[#6b7280] mb-6">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span className="text-[#0a1628] font-medium">
            {params.q ? `Search: "${params.q}"` : "All Products"}
          </span>
        </nav>

        <div className="flex gap-6">
          {/* Filters sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <FilterPanel
              brands={data?.brands ?? []}
              categories={data?.categories ?? []}
              currentBrand={params.brand}
              currentCategory={params.category}
            />
          </aside>

          {/* Product grid */}
          <div className="flex-1 min-w-0">
            {/* Results bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-sm text-[#6b7280]">
                {data ? (
                  <>
                    <span className="font-semibold text-[#0a1628]">{data.total.toLocaleString()}</span> products
                    {params.q && <> for <span className="font-semibold">"{params.q}"</span></>}
                  </>
                ) : (
                  "Loading..."
                )}
              </p>
              <SortSelect value={params.sort ?? "relevance"} />
            </div>

            <ProductGrid products={data?.products ?? []} />

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-10 gap-2">
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <a
                    key={p}
                    href={`?${new URLSearchParams({ ...params, page: String(p) }).toString()}`}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      p === (data?.page ?? 1)
                        ? "bg-[#0057b8] text-white"
                        : "bg-white border border-[#e5e7eb] text-[#374151] hover:border-[#0057b8] hover:text-[#0057b8]"
                    }`}
                  >
                    {p}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>    </>
  );
}
