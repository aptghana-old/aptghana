import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, BrandModel, ProductModel, CategoryModel, Types } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { SITE_DOMAIN } from "@apt/config";
import { ChevronLeft, Edit, Package, Globe, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Panel, StatCard, BarList } from "@/components/analytics/primitives";
import { auth } from "@/lib/auth";
import { brandTint, brandInitials } from "@/lib/brandTints";

interface BrandData {
  _id: { toString(): string };
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  logo?: { url?: string; alt?: string };
  country?: string;
  website?: string;
  status: string;
  isFeatured?: boolean;
  isPartner?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ProductRow {
  _id: { toString(): string };
  name: string;
  sku: string;
  status: string;
  pricing?: { listPrice?: number; currency?: string };
  categories?: unknown[];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const brand = await BrandModel.findById(id).select("name").lean() as { name: string } | null;
    return { title: brand ? `${brand.name} — Brands` : "Brand" };
  } catch {
    return { title: "Brand" };
  }
}

async function getData(id: string) {
  await connectDB();
  const brandObjectId = new Types.ObjectId(id);

  const [brand, products, totalProducts, activeSkus, inStockCount, priceAgg, catAgg] = await Promise.all([
    BrandModel.findById(id).lean(),
    // Product.categories is physically raw ObjectIds (see lib/categoryHierarchy.ts),
    // so anything touching that field goes through the native driver.
    ProductModel.collection
      .find(
        { brandId: brandObjectId, status: { $ne: "archived" } },
        { projection: { name: 1, sku: 1, status: 1, pricing: 1, categories: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(12)
      .toArray(),
    ProductModel.countDocuments({ brandId: brandObjectId, status: { $ne: "archived" } }),
    ProductModel.countDocuments({ brandId: brandObjectId, status: "active" }),
    ProductModel.collection.countDocuments({
      brandId: brandObjectId,
      status: { $ne: "archived" },
      $expr: { $gt: [{ $ifNull: ["$inventory.quantity", 0] }, 0] },
    }),
    ProductModel.aggregate<{ _id: null; avg: number }>([
      { $match: { brandId: brandObjectId, status: "active", "pricing.listPrice": { $gt: 0 } } },
      { $group: { _id: null, avg: { $avg: "$pricing.listPrice" } } },
    ]),
    ProductModel.collection
      .aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { brandId: brandObjectId, status: { $ne: "archived" } } },
        { $unwind: "$categories" },
        { $group: { _id: "$categories", count: { $sum: 1 } } },
      ])
      .toArray(),
  ]);

  // Keep only category-level nodes so a product isn't counted once per
  // ancestor (the categories array holds the full Group→…→Range chain).
  const catIds = catAgg.map((c) => c._id).filter((v): v is Types.ObjectId => v instanceof Types.ObjectId);
  const catDocs = catIds.length
    ? await CategoryModel.find({ _id: { $in: catIds }, level: "category" })
        .select("name")
        .lean<{ _id: { toString(): string }; name: string }[]>()
    : [];
  const catNames = new Map(catDocs.map((c) => [c._id.toString(), c.name]));
  const categoryBars = catAgg
    .filter((c) => catNames.has(c._id.toString()))
    .map((c) => ({ id: c._id.toString(), label: catNames.get(c._id.toString())!, value: c.count }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return {
    brand: brand as unknown as BrandData | null,
    products: products as unknown as ProductRow[],
    totalProducts,
    activeSkus,
    inStockCount,
    avgPrice: priceAgg[0]?.avg ?? null,
    categoryBars,
    productCategory: (p: ProductRow) => {
      for (const raw of p.categories ?? []) {
        const name = catNames.get(String(raw));
        if (name) return name;
      }
      return null;
    },
  };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const { brand, products, totalProducts, activeSkus, inStockCount, avgPrice, categoryBars, productCategory } =
    await getData(id);
  if (!brand) notFound();

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "brands:edit");

  const tint = brandTint(brand.name);
  const inStockPct = totalProducts > 0 ? Math.round((inStockCount / totalProducts) * 100) : null;

  return (
    <div>
      {/* Back + actions */}
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>All Brands</Button>
        </Link>
        {canEdit && (
          <div className="ml-auto">
            <Link href={`/dashboard/brands/${id}/edit`}>
              <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit Brand</Button>
            </Link>
          </div>
        )}
      </div>

      <div className="px-4 sm:px-6 pt-4 sm:pt-5 space-y-4">
        {/* Hero */}
        <div className="card p-5 sm:p-6 flex items-center gap-5 flex-wrap">
          <div
            className="w-16 h-16 sm:w-[78px] sm:h-[78px] rounded-2xl flex items-center justify-center shrink-0 overflow-hidden text-[26px] sm:text-[30px] font-extrabold tracking-tighter"
            style={{ background: tint.bg, color: tint.fg }}
          >
            {brand.logo?.url ? (
              <img src={brand.logo.url} alt={brand.name} className="w-full h-full object-contain p-2" />
            ) : (
              brandInitials(brand.name)
            )}
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
                {brand.name}
              </h1>
              <Badge variant={statusVariant(brand.status)} dot>{brand.status}</Badge>
              {brand.isFeatured && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#FFF3E6", color: "#B45309" }}
                >
                  ★ Featured
                </span>
              )}
              {brand.isPartner && (
                <span
                  className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  style={{ background: "#EEF0FF", color: "#3D4CD6" }}
                >
                  Partner
                </span>
              )}
            </div>
            <div className="font-mono text-[12px] mt-1.5" style={{ color: "var(--apt-text-muted)" }}>
              {SITE_DOMAIN}/brands/{brand.slug}
            </div>
            {(brand.shortDescription || brand.description) && (
              <p className="text-[13px] mt-2.5 max-w-2xl leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>
                {brand.shortDescription || brand.description}
              </p>
            )}
          </div>
          {brand.website && (
            <a href={brand.website} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={<Globe size={14} />}>
                Visit site
                <ExternalLink size={11} />
              </Button>
            </a>
          )}
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Products" value={totalProducts.toLocaleString()} accent="#3D4CD6" />
          <StatCard label="Active SKUs" value={activeSkus.toLocaleString()} accent="#00B37E" />
          <StatCard label="Categories" value={categoryBars.length.toLocaleString()} accent="#0BA5A5" />
          <StatCard
            label="Avg. List Price"
            value={avgPrice != null ? `GH₵ ${Math.round(avgPrice).toLocaleString()}` : "—"}
            accent="#F5820A"
          />
        </div>

        {/* Main + sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 pb-4 sm:pb-6 items-start">
          <div className="xl:col-span-2">
            <div className="card overflow-hidden">
              <div className="card-header flex items-center justify-between">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Products
                </h2>
                <Link href={`/dashboard/products?brand=${brand.slug}`}>
                  <Button variant="ghost" size="xs">View all {totalProducts.toLocaleString()}</Button>
                </Link>
              </div>
              {products.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <Package size={24} style={{ color: "var(--apt-text-muted)", margin: "0 auto 8px" }} />
                  <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>No products yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="hidden md:table-cell">Category</th>
                        <th>Status</th>
                        <th className="text-right">Price (GH₵)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((p) => (
                        <tr key={p._id.toString()}>
                          <td>
                            <Link
                              href={`/dashboard/products/${p._id.toString()}`}
                              className="block group"
                            >
                              <div className="text-[12.5px] font-semibold group-hover:text-[#0057b8] transition-colors" style={{ color: "var(--apt-text-primary)" }}>
                                {p.name}
                              </div>
                              <div className="font-mono text-[10.5px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                                {p.sku}
                              </div>
                            </Link>
                          </td>
                          <td className="hidden md:table-cell">
                            <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                              {productCategory(p) ?? "—"}
                            </span>
                          </td>
                          <td><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                          <td className="text-right font-mono text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                            {p.pricing?.listPrice ? p.pricing.listPrice.toLocaleString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {totalProducts > products.length && (
                <div className="px-5 py-2.5 text-[12px]" style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}>
                  Showing {products.length} of {totalProducts.toLocaleString()} products.
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="text-[13px] font-semibold mb-3.5" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
              <dl className="space-y-2.5">
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Country</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{brand.country ?? "—"}</dd>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Slug</dt>
                  <dd className="font-mono font-semibold" style={{ color: "var(--apt-text-primary)" }}>{brand.slug}</dd>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Products</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{totalProducts.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>In stock</dt>
                  <dd className="font-semibold" style={{ color: inStockPct != null ? "#0B8A4E" : "var(--apt-text-primary)" }}>
                    {inStockPct != null ? `${inStockPct}%` : "—"}
                  </dd>
                </div>
                {brand.website && (
                  <div className="flex justify-between text-[12.5px] items-center">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Website</dt>
                    <a
                      href={brand.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 font-semibold hover:underline"
                      style={{ color: "var(--apt-text-brand)" }}
                    >
                      <Globe size={11} /><span>Visit</span><ExternalLink size={10} />
                    </a>
                  </div>
                )}
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Created</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                    {new Date(brand.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                  </dd>
                </div>
                <div className="flex justify-between text-[12.5px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Last updated</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                    {new Date(brand.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                  </dd>
                </div>
              </dl>
            </div>

            {categoryBars.length > 0 && (
              <Panel title="Products by Category">
                <BarList accent="#00B37E" items={categoryBars.map((c) => ({ label: c.label, value: c.value }))} />
              </Panel>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
