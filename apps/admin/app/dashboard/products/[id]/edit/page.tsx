import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ProductModel, BrandModel, Types } from "@apt/db";
import { ChevronLeft, Eye } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import ProductForm, { type SpecGroup } from "@/components/products/ProductForm";

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const product = (await ProductModel.findById(id).select("name").lean()) as { name?: string } | null;
    return { title: product?.name ? `Edit ${product.name}` : "Edit Product" };
  } catch {
    return { title: "Edit Product" };
  }
}

/* Tolerates both the schema shape ({ group, attributes: [{ name, value, unit }] })
   and the legacy import shape ({ groupName, specs: [{ name, values }] }). */
type RawSpec = { name?: string; value?: string; values?: string[]; unit?: string };
type RawSpecGroup = { group?: string; groupName?: string; attributes?: RawSpec[]; specs?: RawSpec[] };

function toFormSpecGroups(groups: RawSpecGroup[] | undefined): SpecGroup[] {
  return (groups ?? [])
    .map((g) => ({
      name: g.group ?? g.groupName ?? "",
      specs: (g.attributes ?? g.specs ?? []).map((a) => ({
        key: a.name ?? "",
        value: Array.isArray(a.values) && a.values.length > 0 ? a.values.join(", ") : a.value ?? "",
        unit: a.unit ?? "",
      })),
    }))
    .filter((g) => g.specs.length > 0);
}

interface ProductDoc {
  _id: Types.ObjectId;
  name: string; sku: string; mpn?: string; supplierRef?: string; slug: string;
  brandId?: Types.ObjectId; brandName?: string;
  primaryCategoryId?: unknown;
  shortDescription?: string; description?: string;
  features?: string[]; applications?: string[]; certifications?: string[]; tags?: string[];
  status: string;
  isNew?: boolean; isFeatured?: boolean; isClearance?: boolean; discount?: number;
  specifications?: RawSpecGroup[];
  pricing?: { listPrice?: number; tradePrice?: number; currency?: string; minimumOrderQty?: number; leadTime?: string; incoterms?: string };
  inventory?: { quantity?: number };
  seo?: { title?: string; description?: string; metaTitle?: string; metaDescription?: string };
}

async function getPageData(id: string) {
  await connectDB();
  const [product, brands] = await Promise.all([
    ProductModel.findById(id).lean().catch(() => null) as Promise<ProductDoc | null>,
    BrandModel.find({ status: "active" }).select("_id name slug").sort({ name: 1 }).lean() as unknown as Promise<
      { _id: { toString(): string }; name: string; slug: string }[]
    >,
  ]);
  return { product, brands };
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const { product: p, brands } = await getPageData(id);
  if (!p) notFound();

  const num = (v: number | undefined | null) => (v != null ? String(v) : "");

  return (
    <div>
      {/* ── Back bar ── */}
      <div
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href={`/dashboard/products/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Back to product</Button>
        </Link>
        <div className="hidden sm:block" style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <span className="font-mono text-[12px] truncate" style={{ color: "var(--apt-text-muted)" }}>{p.sku}</span>
        <div className="ml-auto flex items-center gap-2.5">
          <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
          <Link href={`/dashboard/products/${id}`}>
            <Button variant="secondary" size="sm" icon={<Eye size={13} />}>View</Button>
          </Link>
        </div>
      </div>

      {/* ── Header band ── */}
      <div className="px-4 sm:px-6 pt-5 pb-5" style={{ background: "var(--apt-bg)", borderBottom: "1px solid var(--apt-border)" }}>
        <div className="max-w-[1400px] flex items-start gap-6 flex-wrap">
          <div className="flex-1 min-w-[260px]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>
              Editing product
            </p>
            <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: "var(--apt-text-primary)" }}>
              {p.name}
            </h1>
          </div>

          {/* Identity box */}
          <div
            className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-1 px-4.5 py-3.5 rounded-xl text-[12.5px] shrink-0"
            style={{ border: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}
          >
            {[
              { label: "SKU", value: p.sku },
              { label: "MPN", value: p.mpn },
              { label: "Brand", value: p.brandName },
            ]
              .filter((r) => r.value)
              .map((row) => (
                <div key={row.label} className="contents">
                  <span className="font-mono text-[10.5px] uppercase tracking-wider py-0.5" style={{ color: "var(--apt-text-muted)" }}>{row.label}</span>
                  <span className="font-mono font-semibold py-0.5 break-all" style={{ color: "var(--apt-text-primary)" }}>{row.value}</span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <ProductForm
        productId={id}
        brands={brands.map((b) => ({ value: b._id.toString(), label: b.name, slug: b.slug }))}
        initial={{
          name: p.name,
          sku: p.sku,
          mpn: p.mpn ?? "",
          supplierRef: p.supplierRef ?? "",
          slug: p.slug,
          brandId: p.brandId ? String(p.brandId) : "",
          categoryId: p.primaryCategoryId ? String(p.primaryCategoryId) : "",
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          features: (p.features ?? []).join("\n"),
          applications: (p.applications ?? []).join(", "),
          certifications: (p.certifications ?? []).join(", "),
          tags: (p.tags ?? []).join(", "),
          status: p.status,
          specGroups: toFormSpecGroups(p.specifications),
          listPrice: num(p.pricing?.listPrice),
          tradePrice: num(p.pricing?.tradePrice),
          currency: p.pricing?.currency ?? "GHS",
          minimumOrderQty: num(p.pricing?.minimumOrderQty),
          leadTime: p.pricing?.leadTime ?? "",
          incoterms: p.pricing?.incoterms ?? "",
          quantity: num(p.inventory?.quantity),
          isNew: p.isNew ?? false,
          isFeatured: p.isFeatured ?? false,
          isClearance: p.isClearance ?? false,
          discount: p.discount ? String(p.discount) : "",
          metaTitle: p.seo?.title ?? p.seo?.metaTitle ?? "",
          metaDescription: p.seo?.description ?? p.seo?.metaDescription ?? "",
        }}
      />
    </div>
  );
}
