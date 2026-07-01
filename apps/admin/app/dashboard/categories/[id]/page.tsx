import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, CategoryModel, ProductModel, Types } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { ChevronLeft, ChevronRight, Edit, Package, FolderTree, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { auth } from "@/lib/auth";
import { getBreadcrumb, getLiveProductCount, getLiveProductCounts } from "@/lib/categoryHierarchy";
import { LEVEL_LABEL, LEVEL_BADGE_VARIANT } from "@/lib/categoryLevels";
import { Panel, StatCard, BarList } from "@/components/analytics/primitives";

interface CategoryData {
  _id: { toString(): string };
  name: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  level: string;
  status: string;
  isFeatured?: boolean;
  displayOrder?: number;
  path?: string;
  image?: { url?: string };
  createdAt: Date;
  updatedAt: Date;
}

interface ProductRow {
  _id: { toString(): string };
  name: string;
  sku: string;
  status: string;
  pricing?: { listPrice?: number; currency?: string };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const cat = await CategoryModel.findById(id).select("name").lean() as { name: string } | null;
    return { title: cat ? `${cat.name} — Categories` : "Category" };
  } catch {
    return { title: "Category" };
  }
}

async function getData(id: string) {
  await connectDB();
  // See getLiveProductCount's comment in lib/categoryHierarchy.ts: Product.categories
  // is physically an array of raw ObjectIds, not the schema's {id,name,slug,level}
  // shape, so these two queries go through the native driver (.collection) too.
  const categoryObjectId = new Types.ObjectId(id);
  const [cat, products, children, productCount, inStockCount, breadcrumb] = await Promise.all([
    CategoryModel.findById(id).lean(),
    ProductModel.collection
      .find(
        { categories: categoryObjectId, status: { $ne: "archived" } },
        { projection: { name: 1, sku: 1, status: 1, pricing: 1 } }
      )
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray(),
    CategoryModel.find({ parentId: id }).select("name slug status level").sort({ displayOrder: 1, name: 1 }).lean(),
    getLiveProductCount(id),
    ProductModel.collection.countDocuments({
      categories: categoryObjectId,
      status: { $ne: "archived" },
      $expr: { $gt: [{ $ifNull: ["$inventory.quantity", 0] }, 0] },
    }),
    getBreadcrumb(id),
  ]);

  const children_ = children as unknown as { _id: { toString(): string }; name: string; slug: string; status: string; level: string }[];
  const childCounts = await getLiveProductCounts(children_.map((c) => c._id.toString()));

  return {
    cat: cat as unknown as CategoryData | null,
    products: products as unknown as ProductRow[],
    children: children_,
    childCounts,
    productCount,
    inStockCount,
    breadcrumb,
  };
}

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cat, products, children, childCounts, productCount, inStockCount, breadcrumb } = await getData(id);
  if (!cat) notFound();

  const inStockPct = productCount > 0 ? Math.round((inStockCount / productCount) * 100) : null;

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "categories:edit");

  const catalogueUrl = `/catalog/${breadcrumb.map((b) => b.slug).join("/")}`;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Categories</Button>
        </Link>
        {canEdit && (
          <div className="ml-auto">
            <Link href={`/dashboard/categories/${id}/edit`}>
              <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Breadcrumb / catalogue path */}
      <div className="flex items-center gap-1.5 px-6 py-2.5 flex-wrap text-[12px]" style={{ borderBottom: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}>
        <FolderTree size={12} />
        {breadcrumb.map((b, i) => (
          <span key={b.id} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight size={10} />}
            {b.id === id ? (
              <span style={{ color: "var(--apt-text-primary)", fontWeight: 600 }}>{b.name}</span>
            ) : (
              <Link href={`/dashboard/categories/${b.id}`} className="hover:underline">{b.name}</Link>
            )}
          </span>
        ))}
        <a href={catalogueUrl} target="_blank" rel="noopener noreferrer" className="ml-3 flex items-center gap-1 font-mono text-[11px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>
          {catalogueUrl} <ExternalLink size={9} />
        </a>
      </div>

      <div className="px-6 pt-5 space-y-5">
        {/* Header identity card */}
        <div className="card p-6 flex items-center gap-5 flex-wrap">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden"
            style={{ background: "#EEF0FF", color: "#3D4CD6" }}
          >
            {cat.image?.url ? (
              <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
            ) : (
              <FolderTree size={30} />
            )}
          </div>
          <div className="flex-1 min-w-[220px]">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-[22px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>{cat.name}</h1>
              <Badge variant={statusVariant(cat.status)} dot>{cat.status}</Badge>
              <Badge variant={LEVEL_BADGE_VARIANT[cat.level] ?? "default"}>{LEVEL_LABEL[cat.level] ?? cat.level}</Badge>
              {cat.isFeatured && <Badge variant="info">Featured</Badge>}
            </div>
            <div className="font-mono text-[12px] mt-1.5" style={{ color: "var(--apt-text-muted)" }}>{cat.slug}</div>
            {cat.shortDescription && (
              <p className="text-[13px] mt-2 max-w-2xl" style={{ color: "var(--apt-text-secondary)" }}>{cat.shortDescription}</p>
            )}
          </div>
        </div>

        {/* KPI row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Products (live)" value={productCount.toLocaleString()} accent="#3D4CD6" />
          <StatCard label="Subcategories" value={children.length.toLocaleString()} accent="#0BA5A5" />
          <StatCard label="Level" value={LEVEL_LABEL[cat.level] ?? cat.level} accent="#F5820A" />
          <StatCard label="In Stock" value={inStockPct != null ? `${inStockPct}%` : "—"} accent="#00B37E" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-5">
        {/* Main */}
        <div className="col-span-2 space-y-5">
          {children.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Subcategories ({children.length})
                </h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Level</th><th>Status</th><th className="text-right">Products</th></tr></thead>
                <tbody>
                  {children.map((c) => (
                    <tr key={c._id.toString()}>
                      <td>
                        <Link href={`/dashboard/categories/${c._id.toString()}`} className="flex items-center gap-2 group">
                          <FolderTree size={13} style={{ color: "var(--apt-text-muted)" }} />
                          <span className="text-[13px] group-hover:text-[#0057b8] transition-colors" style={{ color: "var(--apt-text-primary)" }}>
                            {c.name}
                          </span>
                        </Link>
                      </td>
                      <td><span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{LEVEL_LABEL[c.level] ?? c.level}</span></td>
                      <td><Badge variant={statusVariant(c.status)} dot>{c.status}</Badge></td>
                      <td className="text-right font-mono text-[12.5px]" style={{ color: "var(--apt-text-primary)" }}>
                        {(childCounts.get(c._id.toString()) ?? 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Products ({productCount})
              </h2>
            </div>
            {products.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Package size={24} style={{ color: "var(--apt-text-muted)", margin: "0 auto 8px" }} />
                <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>No products in this category</p>
              </div>
            ) : (
              <table className="data-table">
                <thead><tr><th>Product</th><th>SKU</th><th>Status</th><th className="text-right">Price</th></tr></thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id.toString()}>
                      <td>
                        <Link href={`/dashboard/products/${p._id.toString()}`} className="text-[13px] font-medium hover:text-[#0057b8] transition-colors" style={{ color: "var(--apt-text-primary)" }}>
                          {p.name}
                        </Link>
                      </td>
                      <td><span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</span></td>
                      <td><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                      <td className="text-right text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
                        {p.pricing?.listPrice ? `${p.pricing.currency ?? "GHS"} ${p.pricing.listPrice.toLocaleString()}` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {productCount > products.length && (
              <div className="px-5 py-2.5 text-[12px]" style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}>
                Showing {products.length} of {productCount} active products.
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {children.length > 0 && (
            <Panel title="Products by subcategory">
              <BarList
                accent="#0BA5A5"
                items={children.map((c) => ({ label: c.name, value: childCounts.get(c._id.toString()) ?? 0 }))}
              />
            </Panel>
          )}

          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Level</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{LEVEL_LABEL[cat.level] ?? cat.level}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Products (live)</dt>
                <dd className="font-medium" style={{ color: "var(--apt-text-primary)" }}>{productCount}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Children</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{children.length}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Display Order</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{cat.displayOrder ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Updated</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{new Date(cat.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            </dl>
            {canEdit && (
              <p className="text-[11px] mt-3 pt-3" style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-muted)" }}>
                To move this category to a different parent, drag it in the <Link href="/dashboard/categories" className="hover:underline" style={{ color: "var(--apt-text-brand)" }}>hierarchy manager</Link>.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
