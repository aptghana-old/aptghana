import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, BrandModel, ProductModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Tag, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatCard } from "@/components/analytics/primitives";
import { auth } from "@/lib/auth";
import BrandsGrid, { type BrandCard } from "@/components/brands/BrandsGrid";

export const metadata: Metadata = { title: "Brands" };
export const dynamic = "force-dynamic";

interface RawBrand {
  _id: { toString(): string };
  name: string;
  slug: string;
  logo?: { url?: string };
  country?: string;
  status: string;
  isFeatured?: boolean;
  isPartner?: boolean;
}

async function getBrands(): Promise<BrandCard[]> {
  try {
    await connectDB();
    const brands = await BrandModel.find({ status: { $ne: "deleted" } })
      .select("name slug logo country status isFeatured isPartner")
      .sort({ name: 1 })
      .lean<RawBrand[]>();

    const counts = await ProductModel.aggregate<{ _id: string; count: number }>([
      { $match: { brandSlug: { $in: brands.map((b) => b.slug) }, status: "active" } },
      { $group: { _id: "$brandSlug", count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [c._id, c.count]));

    return brands.map((b) => ({
      id: b._id.toString(),
      name: b.name,
      slug: b.slug,
      logoUrl: b.logo?.url || undefined,
      country: b.country,
      status: b.status,
      isFeatured: b.isFeatured ?? false,
      isPartner: b.isPartner ?? false,
      productCount: countMap.get(b.slug) ?? 0,
    }));
  } catch (err) {
    console.error("[brands list]", err);
    return [];
  }
}

export default async function BrandsPage() {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canCreate = hasPermission(role, overrides, "brands:create");

  const brands = await getBrands();

  const featured = brands.filter((b) => b.isFeatured).length;
  const partners = brands.filter((b) => b.isPartner).length;
  const countries = new Set(brands.map((b) => b.country).filter(Boolean)).size;
  const totalProducts = brands.reduce((sum, b) => sum + b.productCount, 0);

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${brands.length} brand${brands.length !== 1 ? "s" : ""} · ${partners} manufacturer partner${partners !== 1 ? "s" : ""} · ${totalProducts.toLocaleString()} products across the catalog`}
        actions={
          canCreate && (
            <Link href="/dashboard/brands/new">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                Add Brand
              </Button>
            </Link>
          )
        }
      />

      <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 space-y-4">
        {brands.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Tag size={22} />}
              title="No brands yet"
              description="Add your first brand to start organising the catalogue."
              action={
                canCreate && (
                  <Link href="/dashboard/brands/new">
                    <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                      Add first brand
                    </Button>
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <>
            {/* KPI strip */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Brands" value={brands.length.toLocaleString()} accent="#3D4CD6" />
              <StatCard label="Featured" value={featured.toLocaleString()} accent="#00B37E" />
              <StatCard label="Partners" value={partners.toLocaleString()} accent="#0BA5A5" />
              <StatCard label="Countries" value={countries.toLocaleString()} accent="#F5820A" />
            </div>

            <BrandsGrid brands={brands} />
          </>
        )}
      </div>
    </div>
  );
}
