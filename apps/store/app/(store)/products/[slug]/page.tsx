import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connectDB, ProductModel, BrandModel } from "@apt/db";
import ProductDetail, { type ProductFull } from "@/components/products/ProductDetail";
import { ProductViewTracker } from "@/components/products/ProductViewTracker";
import { safeJsonLd } from "@apt/auth";
import { STORE_URL } from "@apt/config";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/* ── Full product fetch ────────────────────────────────────────────────────── */
async function getProductFull(slug: string): Promise<ProductFull | null> {
  await connectDB();

  const raw = await ProductModel.findOne({ sku: slug, status: "active" })
    .select(
      "-createdBy -updatedBy -odooProductId -lastSyncedAt -__v " +
      "-salesCount -views -relevanceScore -variantOptions -variants"
    )
    .lean() as Record<string, unknown> | null;

  if (!raw) return null;

  const brandSlug = String(raw.brandSlug ?? "");

  const relatedIds   = ((raw.relatedProducts as string[])  ?? []).slice(0, 6);
  const accessoryIds = ((raw.accessories     as string[])  ?? []).slice(0, 6);
  const replaceIds   = ((raw.replacements    as string[])  ?? []).slice(0, 4);
  const allCrossIds  = [...new Set([...relatedIds, ...accessoryIds, ...replaceIds])];

  const CROSS_SELECT = "name slug sku brandSlug brandName images.main pricing.listPrice pricing.currency inventory.quantity discount isClearance isNew";

  const [ brand, crossSellRaw ] = await Promise.all([
    brandSlug
      ? BrandModel.findOne({ slug: brandSlug })
        .select("slug name logo website country shortDescription productCount isPartner")
        .lean()
      : null,
    allCrossIds.length > 0
      ? ProductModel.find({ _id: { $in: allCrossIds }, status: "active" })
        .select(CROSS_SELECT)
        .limit(16)
        .lean()
      : Promise.resolve([]),
  ]);

  const toStr = (id: unknown) => (id && typeof (id as any).toString === "function") ? (id as any).toString() : String(id);
  const crossMap = new Map((crossSellRaw as any[]).map((p: any) => [toStr(p._id), p]));

  const relatedProducts = relatedIds.map(id => crossMap.get(toStr(id))).filter(Boolean);
  const accessories     = accessoryIds.map(id => crossMap.get(toStr(id))).filter(Boolean);
  const replacements    = replaceIds.map(id => crossMap.get(toStr(id))).filter(Boolean);

  // Fallback: if no cross-sell data at all, fetch products from same primary category then brand
  let fallbackProducts: unknown[] = [];
  if (allCrossIds.length === 0) {
    const primaryCategoryId = raw.primaryCategoryId as string | undefined;
    if (primaryCategoryId) {
      fallbackProducts = await ProductModel.find({
        primaryCategoryId,
        _id: { $ne: raw._id },
        status: "active",
      }).select(CROSS_SELECT).limit(8).lean();
    }
    if (fallbackProducts.length === 0) {
      fallbackProducts = await ProductModel.find({
        brandSlug: raw.brandSlug,
        _id: { $ne: raw._id },
        status: "active",
      }).select(CROSS_SELECT).limit(8).lean();
    }
  }

  return JSON.parse(JSON.stringify({
    ...raw,
    brand: brand ?? null,
    relatedProducts,
    accessories,
    replacements,
    fallbackProducts,
  })) as ProductFull;
}

/* ── Metadata ─────────────────────────────────────────────────────────────── */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  try {
    await connectDB();
    const p = await ProductModel.findOne({ sku: slug })
      .select("name shortDescription images seo brandSlug mpn sku")
      .lean() as Record<string, unknown> | null;
    if (!p) return { title: "Product Not Found" };

    const brandLabel = String(p.brandSlug ?? "")
      .split("-").map((w) => w[ 0 ].toUpperCase() + w.slice(1)).join(" ");
    const seo = (p.seo ?? {}) as Record<string, unknown>;
    const title = String(seo.title ?? `${p.name} | ${brandLabel} — APT Ghana`);
    const desc = String(seo.description ?? p.shortDescription ?? "");
    const img = ((p.images as Record<string, Record<string, string>>)?.main?.url);

    return {
      title,
      description: desc,
      keywords: Array.isArray(seo.keywords) ? (seo.keywords as string[]).join(", ") : undefined,
      openGraph: {
        title: String(p.name),
        description: desc,
        images: img ? [ { url: img, alt: String(p.name) } ] : [],
        type: "website",
      },
      alternates: { canonical: `/products/${slug}` },
    };
  } catch {
    return { title: "Product — APT Ghana" };
  }
}

export const revalidate = 3600;

/* ── Page ─────────────────────────────────────────────────────────────────── */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;

  let product: ProductFull | null = null;
  try {
    product = await getProductFull(slug);
  } catch (e) {
    console.error("[ProductPage]", e);
  }
  if (!product) notFound();

  const brandName =
    product.brand?.name ??
    product.brandSlug.split("-").map((w) => w[ 0 ].toUpperCase() + w.slice(1)).join(" ");

  const ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.shortDescription,
    sku: product.sku,
    mpn: product.mpn,
    image: [ product.images.main?.url, ...(product.images.gallery ?? []).map((g) => g.url) ].filter(Boolean),
    brand: { "@type": "Brand", name: brandName },
    manufacturer: { "@type": "Organization", name: brandName },
    offers: {
      "@type": "Offer",
      priceCurrency: product.pricing.currency,
      ...(product.pricing.listPrice > 0 ? { price: product.pricing.listPrice } : {}),
      availability:
        (product.inventory?.quantity ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/BackOrder",
      seller: { "@type": "Organization", name: "APT Ghana" },
    },
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: STORE_URL },
      { "@type": "ListItem", position: 2, name: "Products", item: `${STORE_URL}/catalog` },
      { "@type": "ListItem", position: 3, name: brandName, item: `${STORE_URL}/brands/${product.brandSlug}` },
      { "@type": "ListItem", position: 4, name: product.name, item: `${STORE_URL}/products/${slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(ld) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(breadcrumbLd) }} />
      <ProductViewTracker productId={product._id} />
      <main className="container-store py-6 md:py-10 flex-1">
        <ProductDetail product={product} />
      </main>
    </>
  );
}
