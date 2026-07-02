import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, BrandModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import BrandForm from "@/components/brands/BrandForm";

export const metadata: Metadata = { title: "Edit Brand" };

async function getBrand(id: string) {
  await connectDB();
  const brand = await BrandModel.findById(id).lean();
  return brand as unknown as {
    _id: { toString(): string };
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    logo?: { url?: string; alt?: string };
    country?: string;
    website?: string;
    status: string;
    isFeatured?: boolean;
    isPartner?: boolean;
  } | null;
}

export default async function EditBrandPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brand = await getBrand(id);
  if (!brand) notFound();

  const initial = {
    name: brand.name,
    slug: brand.slug,
    description: brand.description ?? "",
    shortDescription: brand.shortDescription ?? "",
    country: brand.country ?? "",
    website: brand.website ?? "",
    logoUrl: brand.logo?.url ?? "",
    status: brand.status,
    isFeatured: brand.isFeatured ?? false,
    isPartner: brand.isPartner ?? false,
  };

  return (
    <div>
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href={`/dashboard/brands/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>{brand.name}</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Edit Brand</h1>
      </div>
      <div className="p-4 sm:p-6 max-w-5xl">
        <BrandForm initial={initial} brandId={id} />
      </div>
    </div>
  );
}
