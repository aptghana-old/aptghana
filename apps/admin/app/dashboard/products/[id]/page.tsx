import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ProductModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { ChevronLeft, Edit, Package, Tag, FolderTree, DollarSign, Globe, ChevronRight, ExternalLink } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import ProductMoveButton from "@/components/products/ProductMoveButton";

export const metadata: Metadata = { title: "Product Detail" };

interface Props { params: Promise<{ id: string }> }

async function getProduct(id: string) {
  try {
    await connectDB();
    return ProductModel.findById(id).lean();
  } catch { return null; }
}

type Spec = { name?: string; value?: string; values?: string[] };
type SpecGroup = { groupName?: string; group?: string; specs?: Spec[]; attributes?: Spec[] };

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const raw = await getProduct(id);
  if (!raw) notFound();

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "products:edit");

  const p = raw as unknown as {
    _id: { toString(): string };
    name: string; sku: string; mpn?: string; slug: string;
    brandName?: string; brandSlug?: string;
    categories?: { id: string; name: string; slug: string; level: "group" | "category" | "subcategory" | "range" }[];
    primaryCategoryId?: string;
    catalogue?: { path?: string; url?: string };
    shortDescription?: string; description?: string;
    status: string;
    specifications?: SpecGroup[];
    pricing?: { listPrice?: number; tradePrice?: number; currency?: string };
    inventory?: { quantity?: number; tracked?: boolean };
    images?: {
      main?: { url?: string; alt?: string };
      gallery?: { url?: string; alt?: string }[];
    };
    documents?: { type: string; title: string; url: string }[];
    seo?: { metaTitle?: string; metaDescription?: string };
    createdAt: Date; updatedAt: Date;
  };

  return (
    <div>
      <div className="flex items-center gap-4 px-4 sm:px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Products</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold truncate flex-1" style={{ color: "var(--apt-text-primary)" }}>{p.name}</h1>
        <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
        <Link href={`/dashboard/products/${p._id.toString()}/edit`}>
          <Button variant="primary" size="sm" icon={<Edit size={13} />}>Edit Product</Button>
        </Link>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
        {/* Main col */}
        <div className="xl:col-span-2 space-y-5">
          {/* Images */}
          {p.images?.main?.url && (
            <div className="card p-5">
              <div
                className="w-full rounded-xl overflow-hidden flex items-center justify-center"
                style={{ height: 280, background: "var(--apt-bg-raised)" }}
              >
                <img
                  src={p.images.main.url}
                  alt={p.images.main.alt ?? p.name}
                  className="max-h-full max-w-full object-contain"
                  loading="lazy"
                />
              </div>
              {p.images.gallery && p.images.gallery.length > 0 && (
                <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                  {p.images.gallery.map((img, i) => (
                    img.url && (
                      <div
                        key={i}
                        className="w-16 h-16 rounded-lg shrink-0 overflow-hidden border cursor-pointer hover:border-[#0057b8] transition-colors"
                        style={{ background: "var(--apt-bg-raised)", borderColor: "var(--apt-border)" }}
                      >
                        <img src={img.url} alt={img.alt ?? p.name} className="w-full h-full object-contain p-1" loading="lazy" />
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {(p.shortDescription || p.description) && (
            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Description</p>
              {p.shortDescription && (
                <p className="text-[14px] font-medium mb-2" style={{ color: "var(--apt-text-primary)" }}>{p.shortDescription}</p>
              )}
              {p.description && (
                <p className="text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>{p.description}</p>
              )}
            </div>
          )}

          {/* Specifications */}
          {p.specifications && p.specifications.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Technical Specifications</h2>
              </div>
              {p.specifications.map((group, gi) => {
                const rows = group.specs ?? group.attributes ?? [];
                if (!rows.length) return null;
                return (
                  <div key={gi}>
                    {(group.groupName ?? group.group) && (
                      <div className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider" style={{ background: "var(--apt-bg-subtle)", color: "var(--apt-text-muted)", borderBottom: "1px solid var(--apt-border)" }}>
                        {group.groupName ?? group.group}
                      </div>
                    )}
                    <table className="data-table">
                      <tbody>
                        {rows.map((spec, si) => (
                          <tr key={si}>
                            <td className="font-medium w-48" style={{ color: "var(--apt-text-secondary)" }}>{spec.name}</td>
                            <td style={{ color: "var(--apt-text-primary)" }}>
                              {Array.isArray(spec.values) ? spec.values.join(", ") : (spec.value ?? "—")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          )}

          {/* Documents */}
          {p.documents && p.documents.length > 0 && (
            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Documents</p>
              <div className="space-y-2">
                {p.documents.map((doc, i) => (
                  <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg border hover:bg-[var(--apt-bg-subtle)] transition-colors"
                    style={{ borderColor: "var(--apt-border)" }}
                  >
                    <div className="w-7 h-7 rounded flex items-center justify-center" style={{ background: "#fee2e2" }}>
                      <span className="text-[9px] font-bold" style={{ color: "#dc2626" }}>PDF</span>
                    </div>
                    <div>
                      <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{doc.title}</div>
                      <div className="text-[11px] capitalize" style={{ color: "var(--apt-text-muted)" }}>{doc.type}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Identity */}
          <div className="card p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Identity</p>
            {[
              { icon: <Package size={13} />, label: "SKU", value: p.sku },
              { icon: <Package size={13} />, label: "MPN", value: p.mpn },
              { icon: <Globe size={13} />, label: "Slug", value: p.slug },
            ].filter((r) => r.value).map((row) => (
              <div key={row.label} className="flex items-start gap-2.5">
                <span style={{ color: "var(--apt-text-muted)" }} className="mt-0.5">{row.icon}</span>
                <div>
                  <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--apt-text-muted)" }}>{row.label}</div>
                  <div className="font-mono text-[12px]" style={{ color: "var(--apt-text-primary)" }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Brand */}
          {p.brandName && (
            <div className="card p-5 space-y-3">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Brand</p>
              <div className="flex items-center gap-2.5">
                <Tag size={13} style={{ color: "var(--apt-text-muted)" }} />
                <Link href={`/dashboard/brands?slug=${p.brandSlug}`} className="text-[13px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                  {p.brandName}
                </Link>
              </div>
            </div>
          )}

          {/* Catalogue Assignment */}
          <div className="card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Catalogue Assignment</p>
              {canEdit && <ProductMoveButton productId={p._id.toString()} currentCategoryId={p.primaryCategoryId} />}
            </div>

            {(["group", "category", "subcategory", "range"] as const).map((level) => {
              const node = p.categories?.find((c) => c.level === level);
              return (
                <div key={level} className="flex items-center gap-2.5">
                  <FolderTree size={13} style={{ color: node ? "var(--apt-text-muted)" : "var(--apt-text-disabled)" }} />
                  <div>
                    <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--apt-text-muted)" }}>
                      {level}
                    </div>
                    <div className="text-[13px]" style={{ color: node ? "var(--apt-text-primary)" : "var(--apt-text-disabled)" }}>
                      {node?.name ?? "—"}
                    </div>
                  </div>
                </div>
              );
            })}

            {p.catalogue?.url ? (
              <div className="pt-2" style={{ borderTop: "1px solid var(--apt-border)" }}>
                <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--apt-text-muted)" }}>Catalogue URL</div>
                <a
                  href={p.catalogue.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[12px] hover:underline break-all"
                  style={{ color: "var(--apt-text-brand)" }}
                >
                  {p.catalogue.url} <ExternalLink size={10} className="shrink-0" />
                </a>
                <div className="flex items-center gap-1 mt-2 flex-wrap text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                  {p.categories?.map((c, i) => (
                    <span key={c.id} className="flex items-center gap-1">
                      {i > 0 && <ChevronRight size={9} />}
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-[12px] pt-1" style={{ color: "var(--apt-text-muted)" }}>Not assigned to a catalogue location yet.</p>
            )}
          </div>

          {/* Pricing */}
          <div className="card p-5 space-y-3">
            <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Pricing &amp; Inventory</p>
            <div className="flex items-center gap-2.5">
              <DollarSign size={13} style={{ color: "var(--apt-text-muted)" }} />
              <div>
                <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--apt-text-muted)" }}>List Price</div>
                <div className="text-[15px] font-bold" style={{ color: "var(--apt-text-primary)" }}>
                  {p.pricing?.listPrice ? `${p.pricing.currency ?? "GHS"} ${p.pricing.listPrice.toLocaleString()}` : "—"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--apt-text-muted)" }}>Stock</div>
              <Badge variant={(p.inventory?.quantity ?? 0) > 0 ? "success" : "error"} dot>
                {(p.inventory?.quantity ?? 0) > 0 ? `${p.inventory!.quantity} in stock` : "Out of stock"}
              </Badge>
            </div>
          </div>

          {/* SEO */}
          {p.seo && (
            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>SEO</p>
              {p.seo.metaTitle && <p className="text-[12px] font-medium mb-1" style={{ color: "var(--apt-text-primary)" }}>{p.seo.metaTitle}</p>}
              {p.seo.metaDescription && <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{p.seo.metaDescription}</p>}
            </div>
          )}

          {/* Timestamps */}
          <div className="card p-5 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>Activity</p>
            <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Created {new Date(p.createdAt).toLocaleString("en-GH")}</p>
            <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>Updated {new Date(p.updatedAt).toLocaleString("en-GH")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
