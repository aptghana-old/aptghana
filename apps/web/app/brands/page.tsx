import type { Metadata } from "next";
import Header from "@/components/navigation/Header";
import Footer from "@/components/navigation/Footer";
import Link from "next/link";
import { connectDB, BrandModel } from "@apt/db";
import { BrandsPageContent, type BrandListItem, EmptyState, ErrorState } from "@apt/ui";
import { SITE_URL, STORE_URL } from "@apt/config";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Industrial Brand Partners | APT Ghana",
  description:
    "APT Ghana is the authorised distributor for 26+ world-class industrial brands including Schneider Electric, WEG, Camozzi, and more. Genuine products, manufacturer warranty.",
  openGraph: {
    title: "Industrial Brand Partners | APT Ghana",
    description:
      "26+ global industrial brands available through APT Ghana's distribution network in West Africa.",
    url: `${SITE_URL}/brands`,
  },
  alternates: { canonical: `${SITE_URL}/brands` },
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
    console.error("[brands] Failed to load brands:", err);
    return { brands: null, error: true };
  }
}

export default async function BrandsPage() {
  const { brands, error } = await getBrands();

  return (
    <>
      <Header />
      <main>
        {error ? (
          <div className="container-apt py-32">
            <ErrorState
              title="Unable to load brands"
              description="We could not retrieve our brand directory at this time. Please refresh the page or contact us directly."
              action={
                <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-[#0057b8] text-white text-sm font-semibold rounded-lg hover:bg-[#1a73e8] transition-colors">
                  Contact Us
                </Link>
              }
            />
          </div>
        ) : brands && brands.length === 0 ? (
          <div className="container-apt py-32">
            <EmptyState
              title="No brands listed yet"
              description="Our brand directory is being updated. In the meantime, contact our team to enquire about available manufacturer partnerships."
              action={
                <Link href="/contact" className="inline-flex items-center gap-2 h-10 px-5 bg-[#0057b8] text-white text-sm font-semibold rounded-lg hover:bg-[#1a73e8] transition-colors">
                  Enquire Now
                </Link>
              }
            />
          </div>
        ) : (
          <BrandsPageContent
            brands={brands!}
            config={{
              containerClass: "container-apt",
              brandHref: `${STORE_URL}/brands`,
              rfqHref: `${STORE_URL}/rfq`,
              contactHref: "/contact",
            }}
          />
        )}
      </main>
      <Footer />
    </>
  );
}
