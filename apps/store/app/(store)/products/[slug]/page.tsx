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

  // Parallel: brand + related/accessory products
  const relatedIds = [
    ...((raw.relatedProducts as string[]) ?? []),
    ...((raw.accessories as string[]) ?? []),
  ].slice(0, 8);

  const [ brand, relatedRaw ] = await Promise.all([
    brandSlug
      ? BrandModel.findOne({ slug: brandSlug })
        .select("slug name logo website country shortDescription productCount isPartner")
        .lean()
      : null,
    relatedIds.length > 0
      ? ProductModel.find({ _id: { $in: relatedIds }, status: "active" })
        .select("name slug sku brandSlug images.main pricing.listPrice pricing.currency inventory.quantity discount isClearance isNew")
        .limit(6)
        .lean()
      : [],
  ]);

  return JSON.parse(JSON.stringify({
    ...raw,
    brand: brand ?? null,
    relatedProducts: relatedRaw ?? [],
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
      { "@type": "ListItem", position: 2, name: "Products", item: `${STORE_URL}/products` },
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
