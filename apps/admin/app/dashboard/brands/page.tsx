import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, BrandModel, ProductModel } from "@apt/db";
import { Tag, Plus, Globe, ExternalLink } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Brands" };

async function getBrands() {
  try {
    await connectDB();
    const brands = await BrandModel.find({ status: { $ne: "deleted" } })
      .sort({ name: 1 })
      .lean();

    const slugs = brands.map((b) => (b as unknown as { slug: string }).slug);
    const counts = await ProductModel.aggregate([
      { $match: { brandSlug: { $in: slugs }, status: "active" } },
      { $group: { _id: "$brandSlug", count: { $sum: 1 } } },
    ]);

    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    return brands.map((b) => {
      const brand = b as unknown as {
        _id: { toString(): string };
        name: string;
        slug: string;
        logoUrl?: string;
        country?: string;
        website?: string;
        status: string;
        isFeatured?: boolean;
        updatedAt: Date;
      };
      return { ...brand, productCount: countMap[brand.slug] ?? 0 };
    });
  } catch {
    return [];
  }
}

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div>
      <PageHeader
        title="Brands"
        description={`${brands.length} brand${brands.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/dashboard/brands/new">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Add Brand
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {brands.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Tag size={22} />}
              title="No brands yet"
              description="Add your first brand to start organising the catalogue."
              action={
                <Link href="/dashboard/brands/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                    Add first brand
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th className="hidden sm:table-cell">Country</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Featured</th>
                  <th className="hidden md:table-cell">Website</th>
                  <th className="hidden lg:table-cell">Updated</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {brands.map((brand) => (
                  <tr key={brand._id.toString()}>
                    <td>
                      <Link
                        href={`/dashboard/brands/${brand._id.toString()}`}
                        className="flex items-center gap-3 group"
                      >
                        <div
                          className="w-9 h-9 rounded-lg shrink-0 flex items-center justify-center overflow-hidden"
                          style={{ background: "var(--apt-bg-raised)" }}
                        >
                          {brand.logoUrl ? (
                            <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain p-1" />
                          ) : (
                            <Tag size={15} style={{ color: "var(--apt-text-muted)" }} />
                          )}
                        </div>
                        <div>
                          <div
                            className="text-[13px] font-medium group-hover:text-[#0057b8] transition-colors"
                            style={{ color: "var(--apt-text-primary)" }}
                          >
                            {brand.name}
                          </div>
                          <div className="text-[11px] font-mono hidden sm:block" style={{ color: "var(--apt-text-muted)" }}>
                            {brand.slug}
                          </div>
                        </div>
                      </Link>
                    </td>
                    <td className="hidden sm:table-cell">
                      <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
                        {brand.country ?? "—"}
                      </span>
                    </td>
                    <td>
                      <span className="text-[13px] font-medium tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                        {brand.productCount.toLocaleString()}
                      </span>
                    </td>
                    <td>
                      <Badge variant={statusVariant(brand.status)} dot>
                        {brand.status}
                      </Badge>
                    </td>
                    <td className="hidden md:table-cell">
                      {brand.isFeatured ? (
                        <Badge variant="info">Featured</Badge>
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>—</span>
                      )}
                    </td>
                    <td className="hidden md:table-cell">
                      {brand.website ? (
                        <a
                          href={brand.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[12px] hover:underline"
                          style={{ color: "var(--apt-text-brand)" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Globe size={11} />
                          <span>Visit</span>
                          <ExternalLink size={10} />
                        </a>
                      ) : (
                        <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>—</span>
                      )}
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {new Date(brand.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                      </span>
                    </td>
                    <td>
                      <Link
                        href={`/dashboard/brands/${brand._id.toString()}/edit`}
                        className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                        style={{ color: "var(--apt-text-muted)" }}
                      >
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>{/* /overflow-x-auto */}
          </div>
        )}
      </div>
    </div>
  );
}
