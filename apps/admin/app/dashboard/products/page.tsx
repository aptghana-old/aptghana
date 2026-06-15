import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, ProductModel, BrandModel, CategoryModel } from "@apt/db";
import { Package, Plus, Search, Filter, Download, Upload } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import ProductFilters from "@/components/products/ProductFilters";

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
        .select("name sku mpn slug brandName brandSlug categories status pricing.listPrice pricing.currency inventory.quantity images updatedAt")
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
      CategoryModel.find({ status: "active", depth: 0 }).select("name slug").sort({ name: 1 }).lean() as unknown as { name: string; slug: string }[],
    ]);
    return { brands, categories };
  } catch {
    return { brands: [] as { name: string; slug: string }[], categories: [] as { name: string; slug: string }[] };
  }
}

export default async function ProductsPage({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));

  const [ { products, total, pages }, { brands, categories } ] = await Promise.all([
    getProducts({ ...params, page }),
    getFilterOptions(),
  ]);

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
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-px hidden sm:table-cell">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th>Product</th>
                  <th className="hidden sm:table-cell">SKU</th>
                  <th className="hidden md:table-cell">Brand</th>
                  <th className="hidden lg:table-cell">Category</th>
                  <th>Status</th>
                  <th className="text-right hidden sm:table-cell">Price</th>
                  <th className="text-right">Stock</th>
                  <th className="hidden lg:table-cell">Updated</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const prod = p as unknown as {
                    _id: { toString(): string };
                    name: string;
                    sku: string;
                    mpn?: string;
                    slug: string;
                    brandName?: string;
                    brandSlug?: string;
                    categories?: { name: string; slug: string }[];
                    status: string;
                    pricing?: { listPrice?: number; currency?: string };
                    inventory?: { quantity?: number };
                    images?: { main?: { url?: string; alt?: string }; gallery?: { url?: string }[] };
                    updatedAt: Date;
                  };

                  const stockQty = prod.inventory?.quantity ?? 0;
                  const stockBadge = stockQty === 0
                    ? "error"
                    : stockQty < 5
                      ? "warning"
                      : "success";

                  const primaryCat = prod.categories?.[ 0 ];

                  return (
                    <tr key={prod._id.toString()} className="cursor-pointer">
                      <td className="hidden sm:table-cell">
                        <input type="checkbox" className="rounded" />
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/products/${prod._id.toString()}`}
                          className="flex items-center gap-3 group"
                        >
                          <div
                            className="w-9 h-9 rounded-md shrink-0 overflow-hidden flex items-center justify-center"
                            style={{ background: "var(--apt-bg-raised)" }}
                          >
                            {prod.images?.main?.url ? (
                              <img src={prod.images.main.url} alt={prod.images.main.alt ?? prod.name} className="w-full h-full object-contain p-0.5" />
                            ) : (
                              <Package size={15} style={{ color: "var(--apt-text-muted)" }} />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div
                              className="text-[13px] font-medium truncate group-hover:text-[#0057b8] transition-colors max-w-[160px] sm:max-w-[220px]"
                              style={{ color: "var(--apt-text-primary)" }}
                            >
                              {prod.name}
                            </div>
                            {prod.mpn && (
                              <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                                MPN: {prod.mpn}
                              </div>
                            )}
                          </div>
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="font-mono text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {prod.sku}
                        </span>
                      </td>
                      <td className="hidden md:table-cell">
                        {prod.brandName ? (
                          <Link
                            href={`/dashboard/brands?slug=${prod.brandSlug}`}
                            className="text-[13px] hover:underline"
                            style={{ color: "var(--apt-text-secondary)" }}
                          >
                            {prod.brandName}
                          </Link>
                        ) : (
                          <span className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>—</span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell">
                        {primaryCat ? (
                          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                            {primaryCat.name}
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>Uncategorised</span>
                        )}
                      </td>
                      <td>
                        <Badge variant={statusVariant(prod.status)} dot>
                          {prod.status}
                        </Badge>
                      </td>
                      <td className="text-right hidden sm:table-cell">
                        {prod.pricing?.listPrice ? (
                          <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                            {prod.pricing.currency ?? "GHS"} {prod.pricing.listPrice.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>—</span>
                        )}
                      </td>
                      <td className="text-right">
                        <Badge variant={stockBadge}>
                          {stockQty === 0 ? "Out" : stockQty.toLocaleString()}
                        </Badge>
                      </td>
                      <td className="hidden lg:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {new Date(prod.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/products/${prod._id.toString()}/edit`}
                          className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                          style={{ color: "var(--apt-text-muted)" }}
                        >
                          Edit
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            </div>{/* /overflow-x-auto */}

            {/* Pagination */}
            {pages > 1 && (
              <div
                className="flex items-center justify-between px-5 py-3"
                style={{ borderTop: "1px solid var(--apt-border)" }}
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
          </div>
        )}
      </div>
    </div>
  );
}
