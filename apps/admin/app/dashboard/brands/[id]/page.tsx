import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, BrandModel, ProductModel } from "@apt/db";
import { ChevronLeft, Edit, Package, Globe, ExternalLink, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";

interface BrandData {
  _id: { toString(): string };
  name: string;
  slug: string;
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
  const [brand, products] = await Promise.all([
    BrandModel.findById(id).lean(),
    ProductModel.find({ brandId: id, status: { $ne: "archived" } })
      .select("name sku status pricing")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean(),
  ]);
  return {
    brand: brand as unknown as BrandData | null,
    products: products as unknown as ProductRow[],
  };
}

export default async function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { brand, products } = await getData(id);
  if (!brand) notFound();

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/brands">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Brands</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{brand.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`/dashboard/brands/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit Brand</Button>
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-5">
        {/* Main info */}
        <div className="col-span-2 space-y-5">
          {/* Products */}
          <div className="card overflow-hidden">
            <div className="card-header flex items-center justify-between">
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Products ({products.length})
              </h2>
              <Link href={`/dashboard/products?brand=${brand.slug}`}>
                <Button variant="ghost" size="xs">View all</Button>
              </Link>
            </div>
            {products.length === 0 ? (
              <div className="px-5 py-8 text-center">
                <Package size={24} style={{ color: "var(--apt-text-muted)", margin: "0 auto 8px" }} />
                <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>No products yet</p>
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
          {/* Logo + meta */}
          <div className="card p-5 space-y-4">
            {brand.logo?.url && (
              <div className="w-full h-32 rounded-lg border flex items-center justify-center" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg-subtle)" }}>
                <img src={brand.logo.url} alt={brand.name} className="max-h-full max-w-full object-contain p-4" />
              </div>
            )}
            <div>
              <div className="text-[18px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{brand.name}</div>
              <div className="font-mono text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{brand.slug}</div>
            </div>
            {brand.description && (
              <p className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{brand.description}</p>
            )}
            <div className="flex flex-col gap-2">
              <Badge variant={statusVariant(brand.status)} dot>{brand.status}</Badge>
              {brand.isFeatured && <Badge variant="info">Featured</Badge>}
              {brand.isPartner && <Badge variant="blue">Partner</Badge>}
            </div>
          </div>

          {/* Details */}
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              {brand.country && (
                <div className="flex justify-between text-[12px]">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Country</dt>
                  <dd style={{ color: "var(--apt-text-primary)" }}>{brand.country}</dd>
                </div>
              )}
              {brand.website && (
                <div className="flex justify-between text-[12px] items-center">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Website</dt>
                  <a href={brand.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1" style={{ color: "var(--apt-text-brand)" }}>
                    <Globe size={11} /><span>Visit</span><ExternalLink size={10} />
                  </a>
                </div>
              )}
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Products</dt>
                <dd className="font-medium" style={{ color: "var(--apt-text-primary)" }}>{products.length}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Created</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{new Date(brand.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
