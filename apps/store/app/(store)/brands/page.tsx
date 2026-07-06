import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, BrandModel } from "@apt/db";
import { STORE_URL } from "@apt/config";
import { BrandsPageContent, type BrandListItem, EmptyState, ErrorState } from "@apt/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Industrial Brand Partners | APT Ghana Store",
  description:
    "APT Ghana is the authorised distributor for 26+ world-class industrial brands including Schneider Electric, WEG, Camozzi, and more. Genuine products, manufacturer warranty.",
  alternates: { canonical: `${STORE_URL}/brands` },
};

async function getBrands(): Promise<{ brands: BrandListItem[] | null; error: boolean }> {
  try {
    await connectDB();
    const docs = await (BrandModel as any)
      .find({ status: "active" })
      .select("name slug country specialty isFeatured isPartner logo productCount displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    if (!docs.length) return { brands: [], error: false };

    return {
      brands: (docs as any[]).map((d: any) => ({
        name: d.name,
        slug: d.slug,
        country: d.country ?? "",
        specialty: d.specialty ?? "",
        isFeatured: d.isFeatured ?? false,
        isPartner: d.isPartner ?? false,
        logoUrl: d.logo?.url ?? "",
        productCount: d.productCount ?? 0,
      })),
      error: false,
    };
  } catch (err) {
    console.error("[store/brands] Failed to load brands:", err);
    return { brands: null, error: true };
  }
}

export default async function StoreBrandsPage() {
  const { brands, error } = await getBrands();

  if (error) {
    return (
      <main className="container-store py-24">
        <ErrorState
          title="Unable to load brands"
          description="We could not retrieve our brand directory at this time. Please refresh the page or contact us directly."
          action={
            <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-xl hover:bg-navy-400 transition-colors">
              Contact Us
            </Link>
          }
        />
      </main>
    );
  }

  if (!brands || brands.length === 0) {
    return (
      <main className="container-store py-24">
        <EmptyState
          title="No brands listed yet"
          description="Our brand directory is being updated. Contact our team to enquire about available products and manufacturer partnerships."
          action={
            <Link href="/rfq" className="inline-flex items-center gap-2 h-10 px-5 bg-navy-500 text-white text-sm font-semibold rounded-xl hover:bg-navy-400 transition-colors">
              Request a Quote
            </Link>
          }
        />
      </main>
    );
  }

  return (
    <BrandsPageContent
      brands={brands}
      config={{
        containerClass: "container-store",
        brandHref: `/brands`,
        rfqHref: "/rfq",
        contactHref: "/contact",
      }}
    />
  );
}
