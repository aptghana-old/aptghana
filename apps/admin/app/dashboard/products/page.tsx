import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, ProductModel, BrandModel, CategoryModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Package, Plus, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import ProductFilters from "@/components/products/ProductFilters";
import ProductTable, { type ProductRow } from "@/components/products/ProductTable";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "Products" };

const PAGE_SIZE = 50;

interface Props {
  searchParams: Promise<{
    q?: string;
    brand?: string;
    category?: string;
    status?: string;
    page?: string;
  }>;
}

async function getProducts(filters: {
  q?: string;
  brand?: string;
  category?: string;
  status?: string;
  page: number;
}) {
  try {
    await connectDB();

    const query: Record<string, unknown> = {};
    if (filters.status) query.status = filters.status;
    else query.status = { $ne: "deleted" };

    if (filters.q) {
      query.$or = [
        { name: { $regex: filters.q, $options: "i" } },
        { sku: { $regex: filters.q, $options: "i" } },
        { mpn: { $regex: filters.q, $options: "i" } },
      ];
    }
    if (filters.brand) query.brandSlug = filters.brand;
    if (filters.category) query[ "categories.slug" ] = filters.category;

    const skip = (filters.page - 1) * PAGE_SIZE;
    const [ products, total ] = await Promise.all([
      ProductModel.find(query)
        .select("name sku mpn slug brandName brandSlug categories primaryCategoryId status pricing.listPrice pricing.currency inventory.quantity images updatedAt")
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
      ProductModel.countDocuments(query),
    ]);

    return { products, total, pages: Math.ceil(total / PAGE_SIZE) };
  } catch {
    return { products: [], total: 0, pages: 0 };
  }
}

async function getFilterOptions() {
  try {
    await connectDB();
    const [ brands, categories ] = await Promise.all([
      BrandModel.find({ status: "active" }).select("name slug").sort({ name: 1 }).lean() as unknown as { name: string; slug: string }[],
      CategoryModel.find({ status: "active", level: "group" }).select("name slug").sort({ name: 1 }).lean() as unknown as { name: string; slug: string }[],
    ]);
    return { brands, categories };
  } catch {
    return { brands: [] as { name: string; slug: string }[], categories: [] as { name: string; slug: string }[] };
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "products:edit");

  const [ { products, total, pages }, { brands, categories } ] = await Promise.all([
    getProducts({ ...params, page }),
    getFilterOptions(),
  ]);

  const rows: ProductRow[] = (products as unknown as Array<{
    _id: { toString(): string };
    name: string; sku: string; mpn?: string;
    brandName?: string; brandSlug?: string;
    categories?: { id: string; name: string; slug: string; level: string }[];
    primaryCategoryId?: string;
    status: string;
    pricing?: { listPrice?: number; currency?: string };
    inventory?: { quantity?: number };
    images?: { main?: { url?: string; alt?: string } };
    updatedAt: Date;
  }>).map((p) => ({
    id: p._id.toString(),
    name: p.name,
    sku: p.sku,
    mpn: p.mpn,
    brandName: p.brandName,
    brandSlug: p.brandSlug,
    primaryCategoryId: p.primaryCategoryId,
    categoryName: p.categories?.[p.categories.length - 1]?.name,
    status: p.status,
    listPrice: p.pricing?.listPrice,
    currency: p.pricing?.currency,
    stockQty: p.inventory?.quantity ?? 0,
    imageUrl: p.images?.main?.url,
    imageAlt: p.images?.main?.alt,
    updatedAt: p.updatedAt instanceof Date ? p.updatedAt.toISOString() : String(p.updatedAt),
  }));

  const hasFilters = !!(params.q || params.brand || params.category || params.status);

  return (
    <div>
      <PageHeader
        title="Products"
        description={`${total.toLocaleString()} product${total !== 1 ? "s" : ""} in catalogue`}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/dashboard/products/import">
              <Button variant="secondary" size="sm" icon={<Upload size={13} />}>
                Import
              </Button>
            </Link>
            <Button variant="secondary" size="sm" icon={<Download size={13} />}>
              Export
            </Button>
            <Link href="/dashboard/products/new">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                Add Product
              </Button>
            </Link>
          </div>
        }
      />

      {/* Filters toolbar */}
      <ProductFilters
        brands={(brands as { name: string; slug: string }[]).map((b) => ({ value: b.slug, label: b.name }))}
        categories={(categories as { name: string; slug: string }[]).map((c) => ({ value: c.slug, label: c.name }))}
        current={{ q: params.q, brand: params.brand, category: params.category, status: params.status }}
      />

      {/* Table */}
      <div className="px-4 sm:px-6 pb-4 sm:pb-6">
        {products.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Package size={22} />}
              title={hasFilters ? "No products match your filters" : "No products yet"}
              description={hasFilters ? "Try adjusting your search or filters." : "Get started by adding your first product to the catalogue."}
              action={
                !hasFilters ? (
                  <Link href="/dashboard/products/new">
                    <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                      Add first product
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <ProductTable rows={rows} canEdit={canEdit} />

            {/* Pagination */}
            {pages > 1 && (
              <div
                className="flex items-center justify-between px-1 mt-3"
              >
                <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                  {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, total)} of {total.toLocaleString()}
                </span>
                <div className="flex items-center gap-1">
                  {page > 1 && (
                    <Link href={`?${new URLSearchParams({ ...params, page: String(page - 1) })}`}>
                      <Button variant="outline" size="xs">← Prev</Button>
                    </Link>
                  )}
                  <span className="text-[12px] px-2" style={{ color: "var(--apt-text-muted)" }}>
                    {page} / {pages}
                  </span>
                  {page < pages && (
                    <Link href={`?${new URLSearchParams({ ...params, page: String(page + 1) })}`}>
                      <Button variant="outline" size="xs">Next →</Button>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
