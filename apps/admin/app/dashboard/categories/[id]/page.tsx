import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, CategoryModel, ProductModel } from "@apt/db";
import { ChevronLeft, Edit, Package, FolderTree } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";

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
  const [cat, products, children] = await Promise.all([
    CategoryModel.findById(id).lean(),
    ProductModel.find({ "categories.id": id, status: { $ne: "archived" } })
      .select("name sku status pricing")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
    CategoryModel.find({ parentId: id }).select("name slug status level").lean(),
  ]);
  return {
    cat: cat as unknown as CategoryData | null,
    products: products as unknown as ProductRow[],
    children: children as unknown as { _id: { toString(): string }; name: string; slug: string; status: string; level: string }[],
  };
}

const LEVEL_LABEL: Record<string, string> = {
  group: "Group",
  category: "Category",
  subcategory: "Subcategory",
  range: "Range",
};

export default async function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { cat, products, children } = await getData(id);
  if (!cat) notFound();

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Categories</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{cat.name}</h1>
        <div className="ml-auto">
          <Link href={`/dashboard/categories/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-5">
        {/* Main */}
        <div className="col-span-2 space-y-5">
          {/* Subcategories */}
          {children.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Subcategories ({children.length})
                </h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Name</th><th>Level</th><th>Status</th></tr></thead>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Products */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Products ({products.length})
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
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            {cat.image?.url && (
              <div className="w-full h-24 rounded-lg border overflow-hidden mb-4" style={{ borderColor: "var(--apt-border)" }}>
                <img src={cat.image.url} alt={cat.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-[18px] font-bold mb-1" style={{ color: "var(--apt-text-primary)" }}>{cat.name}</div>
            <div className="font-mono text-[11px] mb-3" style={{ color: "var(--apt-text-muted)" }}>{cat.slug}</div>
            {cat.shortDescription && (
              <p className="text-[12px] mb-3" style={{ color: "var(--apt-text-secondary)" }}>{cat.shortDescription}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(cat.status)} dot>{cat.status}</Badge>
              <Badge variant="default">{LEVEL_LABEL[cat.level] ?? cat.level}</Badge>
              {cat.isFeatured && <Badge variant="info">Featured</Badge>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Level</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{LEVEL_LABEL[cat.level] ?? cat.level}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Products</dt>
                <dd className="font-medium" style={{ color: "var(--apt-text-primary)" }}>{products.length}</dd>
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
          </div>
        </div>
      </div>
    </div>
  );
}
