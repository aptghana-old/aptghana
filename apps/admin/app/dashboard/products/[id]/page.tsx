import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ProductModel, BrandModel, CategoryModel, Types } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import {
  ChevronLeft, ChevronRight, Edit, ExternalLink, FileText, FolderTree, Package,
} from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/auth";
import ProductMoveButton from "@/components/products/ProductMoveButton";
import ProductImageGallery from "@/components/products/ProductImageGallery";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const product = (await ProductModel.findById(id).select("name").lean()) as { name?: string } | null;
    return { title: product?.name ? `${product.name} — Products` : "Product Detail" };
  } catch {
    return { title: "Product Detail" };
  }
}

/* ── Lean shapes ───────────────────────────────────────────────────────────── */
type Spec = { name?: string; value?: string; values?: string[]; unit?: string };
type SpecGroup = { groupName?: string; group?: string; specs?: Spec[]; attributes?: Spec[] };

interface ProductDoc {
  _id: Types.ObjectId;
  name: string; sku: string; mpn?: string; supplierRef?: string; slug: string;
  brandId?: Types.ObjectId; brandName?: string; brandSlug?: string;
  // Physically raw ObjectIds on imported data; may be CategoryRef snapshots on newer writes.
  categories?: unknown[];
  primaryCategoryId?: unknown;
  catalogue?: { path?: string; url?: string };
  shortDescription?: string; description?: string;
  features?: string[]; applications?: string[]; certifications?: string[];
  tags?: string[];
  status: string;
  isNew?: boolean; isFeatured?: boolean; isClearance?: boolean; discount?: number;
  specifications?: SpecGroup[];
  pricing?: { listPrice?: number; tradePrice?: number; currency?: string; minimumOrderQty?: number; leadTime?: string; incoterms?: string };
  inventory?: { quantity?: number; reservedQuantity?: number; reorderPoint?: number; tracked?: boolean; warehouseLocation?: string };
  images?: { main?: { url?: string; alt?: string }; gallery?: { url?: string; alt?: string }[] };
  documents?: { type?: string; title?: string; url?: string; language?: string; fileSize?: number }[];
  crossReferences?: { brand?: string; mpn?: string; description?: string }[];
  accessories?: unknown[]; relatedProducts?: unknown[];
  seo?: { title?: string; description?: string; keywords?: string[] };
  views?: number; salesCount?: number;
  odooProductId?: number; lastSyncedAt?: Date;
  createdAt: Date; updatedAt: Date;
}

interface CategoryNode { _id: { toString(): string }; name: string; slug: string; level: "group" | "category" | "subcategory" | "range" }
interface BrandDoc { _id: { toString(): string }; name: string; slug: string; country?: string; isPartner?: boolean; logo?: { url?: string; alt?: string } }
interface MiniProduct {
  _id: { toString(): string };
  name: string; sku: string; mpn?: string; status?: string;
  pricing?: { listPrice?: number; currency?: string };
  inventory?: { quantity?: number };
  images?: { main?: { url?: string; alt?: string } };
}

const MINI_PROJECTION = { name: 1, sku: 1, mpn: 1, status: 1, "pricing.listPrice": 1, "pricing.currency": 1, "inventory.quantity": 1, "images.main": 1 };
const LEVEL_ORDER: Record<string, number> = { group: 0, category: 1, subcategory: 2, range: 3 };

function toObjectIds(list: unknown[] | undefined): Types.ObjectId[] {
  return (list ?? [])
    .map((entry) => {
      if (entry instanceof Types.ObjectId) return entry;
      // CategoryRef snapshot ({ id, name, slug, level }) on newer writes.
      // Note: raw bson ObjectIds also expose an `id` prop (byte buffer), hence
      // the instanceof check above must come first.
      const v = entry && typeof entry === "object" && "id" in (entry as Record<string, unknown>)
        ? String((entry as { id: unknown }).id)
        : String(entry);
      return Types.ObjectId.isValid(v) ? new Types.ObjectId(v) : null;
    })
    .filter((v): v is Types.ObjectId => v !== null);
}

async function getData(id: string) {
  await connectDB();
  const product = (await ProductModel.findById(id).lean().catch(() => null)) as ProductDoc | null;
  if (!product) return null;

  const categoryIds = toObjectIds(product.categories);
  const accessoryIds = toObjectIds(product.accessories);
  const relatedIds = toObjectIds(product.relatedProducts);

  const [brand, brandProductCount, categoryDocs, accessories, related] = await Promise.all([
    product.brandId ? (BrandModel.findById(product.brandId).select("name slug country isPartner logo").lean() as Promise<BrandDoc | null>) : null,
    product.brandId ? ProductModel.countDocuments({ brandId: product.brandId, status: { $ne: "archived" } }) : 0,
    categoryIds.length
      ? (CategoryModel.find({ _id: { $in: categoryIds } }).select("name slug level").lean() as unknown as Promise<CategoryNode[]>)
      : [],
    accessoryIds.length
      ? ProductModel.collection.find({ _id: { $in: accessoryIds } }, { projection: MINI_PROJECTION }).toArray()
      : [],
    relatedIds.length
      ? ProductModel.collection.find({ _id: { $in: relatedIds } }, { projection: MINI_PROJECTION }).toArray()
      : [],
  ]);

  // No explicit relations → fall back to siblings in the same catalogue range.
  // primaryCategoryId is a raw ObjectId on imported docs and a string on newer
  // writes, so match both through the native driver (mongoose would cast).
  let relatedFallback: unknown[] = [];
  if (related.length === 0 && product.primaryCategoryId) {
    const rawPrimary = product.primaryCategoryId;
    relatedFallback = await ProductModel.collection
      .find(
        {
          primaryCategoryId: { $in: [rawPrimary, String(rawPrimary)] as never[] },
          _id: { $ne: product._id },
          status: { $ne: "archived" },
        },
        { projection: MINI_PROJECTION }
      )
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(6)
      .toArray();
  }

  const chain = categoryDocs
    .filter((c) => c.level in LEVEL_ORDER)
    .sort((a, b) => LEVEL_ORDER[a.level] - LEVEL_ORDER[b.level]);

  return {
    product,
    brand,
    brandProductCount,
    chain,
    accessories: accessories as unknown as MiniProduct[],
    related: (related.length > 0 ? related : relatedFallback) as unknown as MiniProduct[],
    relatedIsFallback: related.length === 0,
  };
}

/* ── Formatting ────────────────────────────────────────────────────────────── */
const CURRENCY_SYMBOL: Record<string, string> = { GHS: "GH₵", USD: "$", EUR: "€", GBP: "£" };

function money(amount: number | null | undefined, currency?: string) {
  if (amount == null) return "—";
  const cur = currency ?? "USD";
  const sym = CURRENCY_SYMBOL[cur] ?? `${cur} `;
  return `${sym}${amount.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fileMeta(doc: { language?: string; fileSize?: number }) {
  const parts: string[] = [];
  if (doc.language) parts.push(doc.language.toUpperCase());
  if (doc.fileSize) parts.push(doc.fileSize < 1048576 ? `${Math.max(1, Math.round(doc.fileSize / 1024))} KB` : `${(doc.fileSize / 1048576).toFixed(1)} MB`);
  return parts.join(" · ");
}

function docKind(doc: { type?: string; url?: string }) {
  const ext = doc.url?.split("?")[0].split(".").pop() ?? "";
  if (/^[a-z0-9]{2,4}$/i.test(ext)) return ext.toUpperCase();
  return (doc.type ?? "DOC").slice(0, 4).toUpperCase();
}

function fmtDateTime(value: Date | undefined, options: Intl.DateTimeFormatOptions) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-GH", options);
}

function stockTone(qty: number) {
  return qty === 0 ? "#b91c1c" : qty < 30 ? "#b45309" : "#0B8A4E";
}
function stockLabel(qty: number) {
  return qty === 0 ? "No stock" : qty < 30 ? `${qty} · low` : `${qty} in stock`;
}

function normalizeSpecs(groups: SpecGroup[] | undefined) {
  return (groups ?? [])
    .map((g) => ({
      group: g.group ?? g.groupName ?? "Specifications",
      attributes: (g.attributes ?? g.specs ?? []).map((a) => ({
        name: a.name ?? "—",
        display: Array.isArray(a.values) && a.values.length > 0
          ? a.values.join(", ")
          : `${a.value ?? "—"}${a.unit ? ` ${a.unit}` : ""}`,
        unit: a.unit,
        value: a.value,
      })),
    }))
    .filter((g) => g.attributes.length > 0);
}

/* ── Small presentational helpers ──────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
      {children}
    </p>
  );
}

function PanelCard({ title, meta, children }: { title: string; meta?: string; children: React.ReactNode }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-5 py-3 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <SectionLabel>{title}</SectionLabel>
        {meta && <span className="font-mono text-[10.5px]" style={{ color: "var(--apt-text-muted)" }}>{meta}</span>}
      </div>
      {children}
    </div>
  );
}

function NoneRecorded({ children }: { children: React.ReactNode }) {
  return <p className="px-5 py-4 text-[12.5px]" style={{ color: "var(--apt-text-muted)" }}>{children}</p>;
}

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const data = await getData(id);
  if (!data) notFound();
  const { product: p, brand, brandProductCount, chain, accessories, related, relatedIsFallback } = data;

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "products:edit");

  const currency = p.pricing?.currency;
  const seo = p.seo;
  const qty = p.inventory?.quantity ?? 0;
  const dateOpts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" };
  const createdLabel = fmtDateTime(p.createdAt, dateOpts);
  const updatedLabel = fmtDateTime(p.updatedAt, dateOpts);
  const specGroups = normalizeSpecs(p.specifications);
  const specCount = specGroups.reduce((n, g) => n + g.attributes.length, 0);
  // "Ratings at a glance" — spec attributes that carry a unit read as ratings.
  const keyRatings = specGroups
    .flatMap((g) => g.attributes)
    .filter((a) => a.unit && a.value && a.value.length <= 14)
    .slice(0, 8);

  const images = [p.images?.main, ...(p.images?.gallery ?? [])]
    .filter((img): img is { url: string; alt?: string } => Boolean(img?.url))
    .filter((img, i, arr) => arr.findIndex((x) => x.url === img.url) === i)
    .map((img) => ({ url: img.url, alt: img.alt ?? p.name }));

  const brandName = brand?.name ?? p.brandName ?? p.brandSlug;
  const identityRows = [
    { label: "SKU", value: p.sku, mono: true },
    { label: "MPN", value: p.mpn, mono: true },
    { label: "Supplier ref", value: p.supplierRef, mono: true },
    { label: "Slug", value: p.slug, mono: true },
  ].filter((r) => r.value);

  const miniRow = (m: MiniProduct) => ({
    id: m._id.toString(),
    name: m.name,
    sku: m.sku,
    mpn: m.mpn,
    price: money(m.pricing?.listPrice, m.pricing?.currency ?? currency),
    qty: m.inventory?.quantity ?? 0,
    image: m.images?.main?.url,
  });

  return (
    <div>
      {/* ── Back bar ── */}
      <div
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Products</Button>
        </Link>
        <div className="hidden sm:block" style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <span className="font-mono text-[12px] truncate" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
          {canEdit && (
            <Link href={`/dashboard/products/${p._id.toString()}/edit`}>
              <Button variant="primary" size="sm" icon={<Edit size={13} />}>Edit Product</Button>
            </Link>
          )}
        </div>
      </div>

      {/* ── Header band ── */}
      <div className="px-4 sm:px-6 pt-5 pb-5" style={{ background: "var(--apt-bg)", borderBottom: "1px solid var(--apt-border)" }}>
        <div className="max-w-[1400px]">
          {chain.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap text-[12px] mb-3" style={{ color: "var(--apt-text-muted)" }}>
              {chain.map((c, i) => (
                <span key={c._id.toString()} className="flex items-center gap-1.5">
                  {i > 0 && <ChevronRight size={11} style={{ color: "var(--apt-text-disabled)" }} />}
                  <Link
                    href={`/dashboard/categories/${c._id.toString()}`}
                    className="hover:underline"
                    style={{ color: i === chain.length - 1 ? "var(--apt-text-primary)" : "var(--apt-text-muted)", fontWeight: i === chain.length - 1 ? 600 : 400 }}
                  >
                    {c.name}
                  </Link>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-start gap-6 flex-wrap">
            <div className="flex-1 min-w-[260px]">
              <div className="flex items-center gap-1.5 flex-wrap mb-2.5">
                {p.isNew && <Badge variant="blue">NEW</Badge>}
                {p.isFeatured && <Badge variant="warning">FEATURED</Badge>}
                {p.isClearance && <Badge variant="error">CLEARANCE{p.discount ? ` −${p.discount}%` : ""}</Badge>}
                {!p.isClearance && (p.discount ?? 0) > 0 && <Badge variant="error">−{p.discount}%</Badge>}
                {(p.tags ?? []).slice(0, 5).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: "var(--apt-text-primary)" }}>
                {p.name}
              </h1>
              {p.shortDescription && p.shortDescription !== p.name && (
                <p className="text-[13.5px] mt-2 max-w-3xl leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>
                  {p.shortDescription}
                </p>
              )}
            </div>

            {/* Identity box */}
            <div
              className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 px-4.5 py-3.5 rounded-xl text-[12.5px] shrink-0"
              style={{ border: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
            >
              {identityRows.map((row) => (
                <div key={row.label} className="contents">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider py-0.5" style={{ color: "var(--apt-text-muted)" }}>{row.label}</span>
                  <span className={`${row.mono ? "font-mono " : ""}font-semibold py-0.5 break-all`} style={{ color: "var(--apt-text-primary)" }}>{row.value}</span>
                </div>
              ))}
              {brandName && (
                <div className="contents">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider py-0.5" style={{ color: "var(--apt-text-muted)" }}>Brand</span>
                  {brand ? (
                    <Link href={`/dashboard/brands/${brand._id.toString()}`} className="font-semibold py-0.5 hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                      {brandName}
                    </Link>
                  ) : (
                    <span className="font-semibold py-0.5" style={{ color: "var(--apt-text-primary)" }}>{brandName}</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-5 max-w-[1400px] space-y-8 pb-10">
        {/* ── Main three-column band ── */}
        <div className="flex flex-wrap items-start gap-5">
          {/* Gallery + documents */}
          <div className="flex-[1_1_300px] min-w-[280px] max-w-full lg:max-w-[420px] space-y-4">
            <ProductImageGallery images={images} name={p.name} />

            <PanelCard title="Documents" meta={p.documents?.length ? String(p.documents.length) : undefined}>
              {(p.documents ?? []).length === 0 ? (
                <NoneRecorded>No documents uploaded yet.</NoneRecorded>
              ) : (
                <div>
                  {(p.documents ?? []).map((doc, i) => (
                    <a
                      key={i}
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-[var(--apt-bg-subtle)]"
                      style={{ borderBottom: i < (p.documents?.length ?? 0) - 1 ? "1px solid var(--apt-border)" : undefined }}
                    >
                      <span
                        className="font-mono text-[9.5px] font-bold px-1.5 py-0.5 rounded shrink-0"
                        style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
                      >
                        {docKind(doc)}
                      </span>
                      <span className="flex-1 text-[12.5px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>
                        {doc.title ?? doc.type}
                      </span>
                      <span className="font-mono text-[10.5px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
                        {fileMeta(doc)}
                      </span>
                    </a>
                  ))}
                </div>
              )}
            </PanelCard>
          </div>

          {/* Overview */}
          <div className="flex-[2_1_360px] min-w-0 space-y-4">
            {p.description && p.description !== p.shortDescription && (
              <PanelCard title="Description">
                <p className="px-5 py-4 text-[13px] leading-relaxed whitespace-pre-line" style={{ color: "var(--apt-text-secondary)" }}>
                  {p.description}
                </p>
              </PanelCard>
            )}

            <PanelCard title="Key Features">
              {(p.features ?? []).length === 0 ? (
                <NoneRecorded>No features recorded for this product yet.</NoneRecorded>
              ) : (
                <ul className="px-5 py-4 space-y-2.5">
                  {(p.features ?? []).map((feat, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>
                      <span className="shrink-0 mt-[7px] w-1.5 h-1.5 rounded-full" style={{ background: "#0057b8" }} />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelCard>

            {keyRatings.length >= 3 && (
              <PanelCard title="Ratings at a Glance">
                <div className="grid grid-cols-2 sm:grid-cols-4">
                  {keyRatings.map((r, i) => (
                    <div key={i} className="px-5 py-3.5" style={{ borderRight: "1px solid var(--apt-border)", borderBottom: "1px solid var(--apt-border)" }}>
                      <div className="font-mono text-[10px] uppercase tracking-wider mb-1 truncate" style={{ color: "var(--apt-text-muted)" }} title={r.name}>
                        {r.name}
                      </div>
                      <div className="text-[16px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
                        {r.value}
                        <span className="text-[11.5px] font-medium ml-1" style={{ color: "var(--apt-text-muted)" }}>{r.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </PanelCard>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <PanelCard title="Applications">
                {(p.applications ?? []).length === 0 ? (
                  <NoneRecorded>None recorded.</NoneRecorded>
                ) : (
                  <div className="px-5 py-4 flex flex-wrap gap-1.5">
                    {(p.applications ?? []).map((app) => (
                      <span key={app} className="text-[12px] px-2.5 py-1 rounded-md" style={{ border: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)", color: "var(--apt-text-secondary)" }}>
                        {app}
                      </span>
                    ))}
                  </div>
                )}
              </PanelCard>
              <PanelCard title="Certifications">
                {(p.certifications ?? []).length === 0 ? (
                  <NoneRecorded>None recorded.</NoneRecorded>
                ) : (
                  <div className="px-5 py-4 flex flex-wrap gap-1.5">
                    {(p.certifications ?? []).map((cert) => (
                      <span key={cert} className="font-mono text-[11.5px] font-semibold px-2.5 py-1 rounded-md" style={{ border: "1px solid var(--apt-border-strong)", color: "var(--apt-text-primary)" }}>
                        {cert}
                      </span>
                    ))}
                  </div>
                )}
              </PanelCard>
            </div>

            <PanelCard title="Cross-References" meta={p.crossReferences?.length ? String(p.crossReferences.length) : undefined}>
              {(p.crossReferences ?? []).length === 0 ? (
                <NoneRecorded>No competitor cross-references recorded.</NoneRecorded>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Brand</th>
                        <th>MPN</th>
                        <th>Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(p.crossReferences ?? []).map((xr, i) => (
                        <tr key={i}>
                          <td className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{xr.brand}</td>
                          <td className="font-mono text-[12px] font-medium" style={{ color: "var(--apt-text-brand)" }}>{xr.mpn}</td>
                          <td style={{ color: "var(--apt-text-secondary)" }}>{xr.description ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </PanelCard>
          </div>

          {/* Commerce sidebar */}
          <div className="flex-[1_1_280px] min-w-[280px] max-w-full lg:max-w-[380px] space-y-4 xl:sticky xl:top-4">
            {/* Pricing & stock */}
            <div className="card overflow-hidden" style={{ borderColor: "var(--apt-border-strong)" }}>
              <div className="px-5 pt-4 pb-3.5" style={{ borderBottom: "1px solid var(--apt-border)" }}>
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="text-[26px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
                    {money(p.pricing?.listPrice, currency)}
                  </span>
                  <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>/ unit · list price</span>
                </div>
                {p.pricing?.tradePrice != null && p.pricing.tradePrice > 0 && (
                  <div className="flex items-center gap-2 mt-2 text-[12.5px]">
                    <span className="font-mono text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
                      TRADE
                    </span>
                    <span className="font-bold" style={{ color: "var(--apt-text-primary)" }}>{money(p.pricing.tradePrice, currency)}</span>
                  </div>
                )}
              </div>
              <div className="px-5 py-3.5 grid grid-cols-2 gap-y-1.5 gap-x-3 text-[12.5px]">
                <span style={{ color: "var(--apt-text-muted)" }}>Stock</span>
                <span className="font-bold text-right" style={{ color: stockTone(qty) }}>{stockLabel(qty)}</span>
                {(p.inventory?.reservedQuantity ?? 0) > 0 && (
                  <>
                    <span style={{ color: "var(--apt-text-muted)" }}>Reserved</span>
                    <span className="font-semibold text-right" style={{ color: "var(--apt-text-primary)" }}>{p.inventory!.reservedQuantity}</span>
                  </>
                )}
                {p.inventory?.warehouseLocation && (
                  <>
                    <span style={{ color: "var(--apt-text-muted)" }}>Warehouse</span>
                    <span className="font-mono font-semibold text-right" style={{ color: "var(--apt-text-primary)" }}>{p.inventory.warehouseLocation}</span>
                  </>
                )}
                <span style={{ color: "var(--apt-text-muted)" }}>Min. order</span>
                <span className="font-semibold text-right" style={{ color: "var(--apt-text-primary)" }}>{p.pricing?.minimumOrderQty ?? 1} unit{(p.pricing?.minimumOrderQty ?? 1) > 1 ? "s" : ""}</span>
                {p.pricing?.leadTime && (
                  <>
                    <span style={{ color: "var(--apt-text-muted)" }}>Lead time</span>
                    <span className="font-semibold text-right" style={{ color: "var(--apt-text-primary)" }}>{p.pricing.leadTime}</span>
                  </>
                )}
                {p.pricing?.incoterms && (
                  <>
                    <span style={{ color: "var(--apt-text-muted)" }}>Incoterms</span>
                    <span className="font-mono font-semibold text-right" style={{ color: "var(--apt-text-primary)" }}>{p.pricing.incoterms}</span>
                  </>
                )}
              </div>
            </div>

            {/* Catalogue assignment */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <SectionLabel>Catalogue Assignment</SectionLabel>
                {canEdit && (
                  <ProductMoveButton
                    productId={p._id.toString()}
                    currentCategoryId={p.primaryCategoryId ? String(p.primaryCategoryId) : undefined}
                  />
                )}
              </div>
              {(["group", "category", "subcategory", "range"] as const).map((level) => {
                const node = chain.find((c) => c.level === level);
                return (
                  <div key={level} className="flex items-center gap-2.5">
                    <FolderTree size={13} style={{ color: node ? "var(--apt-text-muted)" : "var(--apt-text-disabled)" }} />
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--apt-text-muted)" }}>{level}</div>
                      {node ? (
                        <Link href={`/dashboard/categories/${node._id.toString()}`} className="text-[13px] hover:underline block truncate" style={{ color: "var(--apt-text-primary)" }}>
                          {node.name}
                        </Link>
                      ) : (
                        <div className="text-[13px]" style={{ color: "var(--apt-text-disabled)" }}>—</div>
                      )}
                    </div>
                  </div>
                );
              })}
              {p.catalogue?.url ? (
                <div className="pt-2.5" style={{ borderTop: "1px solid var(--apt-border)" }}>
                  <div className="text-[10px] uppercase tracking-wider font-semibold mb-1" style={{ color: "var(--apt-text-muted)" }}>Catalogue URL</div>
                  <a
                    href={p.catalogue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-[11.5px] hover:underline break-all"
                    style={{ color: "var(--apt-text-brand)" }}
                  >
                    {p.catalogue.url} <ExternalLink size={10} className="shrink-0" />
                  </a>
                </div>
              ) : chain.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Not assigned to a catalogue location yet.</p>
              ) : null}
            </div>

            {/* Brand card */}
            {brand && (
              <Link href={`/dashboard/brands/${brand._id.toString()}`} className="card p-4 flex items-center gap-3.5 transition-colors hover:border-[var(--apt-border-strong)]">
                <div
                  className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                  style={{ border: "1px solid var(--apt-border)", background: "#fff" }}
                >
                  {brand.logo?.url ? (
                    <img src={brand.logo.url} alt={brand.logo.alt ?? brand.name} className="max-w-full max-h-full object-contain p-1" loading="lazy" />
                  ) : (
                    <Package size={16} style={{ color: "var(--apt-text-muted)" }} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-[13.5px] font-bold truncate" style={{ color: "var(--apt-text-primary)" }}>{brand.name}</div>
                  <div className="text-[11.5px] truncate" style={{ color: "var(--apt-text-muted)" }}>
                    {[brand.isPartner ? "Authorised partner" : null, `${brandProductCount.toLocaleString()} products`, brand.country]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                </div>
              </Link>
            )}

            {/* Operations */}
            <div className="card p-5">
              <SectionLabel>Operations</SectionLabel>
              <dl className="mt-3 space-y-2 text-[12.5px]">
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Inventory tracked</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{p.inventory?.tracked === false ? "No" : "Yes"}</dd>
                </div>
                {p.inventory?.reorderPoint != null && (
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Reorder point</dt>
                    <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{p.inventory.reorderPoint} units</dd>
                  </div>
                )}
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Views</dt>
                  <dd className="font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{(p.views ?? 0).toLocaleString()}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Sales</dt>
                  <dd className="font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{(p.salesCount ?? 0).toLocaleString()}</dd>
                </div>
                {p.odooProductId != null && (
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Odoo ID</dt>
                    <dd className="font-mono font-semibold" style={{ color: "var(--apt-text-primary)" }}>{p.odooProductId}</dd>
                  </div>
                )}
                {fmtDateTime(p.lastSyncedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) && (
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Last synced</dt>
                    <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                      {fmtDateTime(p.lastSyncedAt, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* SEO */}
            {seo && (seo.title || seo.description) && (
              <div className="card p-5">
                <SectionLabel>SEO</SectionLabel>
                {seo.title && <p className="text-[12.5px] font-semibold mt-2.5" style={{ color: "var(--apt-text-primary)" }}>{seo.title}</p>}
                {seo.description && <p className="text-[11.5px] mt-1 leading-relaxed" style={{ color: "var(--apt-text-muted)" }}>{seo.description}</p>}
                {(seo.keywords ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {(seo.keywords ?? []).slice(0, 6).map((kw) => (
                      <span key={kw} className="text-[10.5px] px-1.5 py-0.5 rounded" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Activity */}
            {(createdLabel || updatedLabel) && (
              <div className="card p-5 space-y-1.5">
                <SectionLabel>Activity</SectionLabel>
                {createdLabel && <p className="text-[11.5px] pt-1" style={{ color: "var(--apt-text-muted)" }}>Created {createdLabel}</p>}
                {updatedLabel && <p className="text-[11.5px]" style={{ color: "var(--apt-text-muted)" }}>Updated {updatedLabel}</p>}
              </div>
            )}
          </div>
        </div>

        {/* ── Specifications ── */}
        <section>
          <div className="flex items-baseline gap-3 flex-wrap mb-4">
            <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Specifications</h2>
            {specCount > 0 && (
              <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                {specCount} attribute{specCount === 1 ? "" : "s"} · {specGroups.length} group{specGroups.length === 1 ? "" : "s"}
              </span>
            )}
          </div>
          {specGroups.length === 0 ? (
            <div className="card">
              <div className="px-5 py-8 text-center">
                <FileText size={22} style={{ color: "var(--apt-text-muted)", margin: "0 auto 8px" }} />
                <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-secondary)" }}>No specifications yet</p>
                <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>Technical attributes will appear here once added to the product.</p>
              </div>
            </div>
          ) : (
            <div style={{ columns: "2 380px", columnGap: 16 }}>
              {specGroups.map((group) => (
                <div key={group.group} className="card overflow-hidden mb-4" style={{ breakInside: "avoid" }}>
                  <div className="flex items-center justify-between gap-3 px-5 py-3" style={{ borderBottom: "1px solid var(--apt-border-strong)" }}>
                    <span className="text-[13px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{group.group}</span>
                    <span className="font-mono text-[10.5px]" style={{ color: "var(--apt-text-muted)" }}>{group.attributes.length}</span>
                  </div>
                  {group.attributes.map((attr, i) => (
                    <div
                      key={`${attr.name}-${i}`}
                      className="grid grid-cols-2 gap-3 px-5 py-2 text-[12.5px] transition-colors hover:bg-[var(--apt-bg-subtle)]"
                      style={{ borderBottom: i < group.attributes.length - 1 ? "1px solid var(--apt-border)" : undefined }}
                    >
                      <span style={{ color: "var(--apt-text-muted)" }}>{attr.name}</span>
                      <span className="font-semibold break-words" style={{ color: "var(--apt-text-primary)" }}>{attr.display}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Accessories ── */}
        {accessories.length > 0 && (
          <section>
            <div className="flex items-baseline gap-3 flex-wrap mb-4">
              <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Accessories</h2>
              <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>compatible add-ons</span>
            </div>
            <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}>
              {accessories.map(miniRow).map((acc) => (
                <Link key={acc.id} href={`/dashboard/products/${acc.id}`} className="card overflow-hidden flex flex-col transition-colors hover:border-[var(--apt-border-strong)]">
                  <div
                    className="flex items-center justify-center p-4"
                    style={{ aspectRatio: "4 / 3", background: "var(--apt-bg-subtle)", borderBottom: "1px solid var(--apt-border)" }}
                  >
                    {acc.image ? (
                      <img src={acc.image} alt={acc.name} className="max-h-full max-w-full object-contain" loading="lazy" />
                    ) : (
                      <Package size={20} style={{ color: "var(--apt-text-muted)" }} />
                    )}
                  </div>
                  <div className="p-3.5 flex flex-col gap-1.5 flex-1">
                    <span className="font-mono text-[10.5px]" style={{ color: "var(--apt-text-muted)" }}>{acc.sku}</span>
                    <span className="text-[13px] font-semibold leading-snug flex-1" style={{ color: "var(--apt-text-primary)" }}>{acc.name}</span>
                    <div className="flex items-center justify-between gap-2 mt-1">
                      <span className="text-[13.5px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{acc.price}</span>
                      <span className="font-mono text-[10.5px] font-semibold" style={{ color: stockTone(acc.qty) }}>{stockLabel(acc.qty)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Related products ── */}
        {related.length > 0 && (
          <section>
            <div className="flex items-baseline gap-3 flex-wrap mb-4">
              <h2 className="text-[18px] font-bold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>Related products</h2>
              <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                {relatedIsFallback ? "same catalogue range" : "linked references"}
              </span>
            </div>
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Product</th>
                      <th className="hidden md:table-cell">MPN</th>
                      <th className="text-right">List price</th>
                      <th className="text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.map(miniRow).map((rel) => (
                      <tr key={rel.id}>
                        <td>
                          <Link href={`/dashboard/products/${rel.id}`} className="font-mono text-[12px] font-medium hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                            {rel.sku}
                          </Link>
                        </td>
                        <td>
                          <Link href={`/dashboard/products/${rel.id}`} className="font-semibold hover:underline" style={{ color: "var(--apt-text-primary)" }}>
                            {rel.name}
                          </Link>
                        </td>
                        <td className="hidden md:table-cell font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{rel.mpn ?? "—"}</td>
                        <td className="text-right font-bold" style={{ color: "var(--apt-text-primary)" }}>{rel.price}</td>
                        <td className="text-right font-mono text-[11.5px] font-semibold" style={{ color: stockTone(rel.qty) }}>{stockLabel(rel.qty)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
