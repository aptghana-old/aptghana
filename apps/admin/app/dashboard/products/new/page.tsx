import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, BrandModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ProductForm from "@/components/products/ProductForm";

export const metadata: Metadata = { title: "New Product" };

async function getFormData() {
  try {
    await connectDB();
    const brands = await BrandModel.find({ status: "active" }).select("_id name slug").sort({ name: 1 }).lean();
    return { brands };
  } catch {
    return { brands: [] };
  }
}

export default async function NewProductPage() {
  const { brands } = await getFormData();

  return (
    <div>
      {/* Sub-header */}
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>
            Products
          </Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          New Product
        </h1>
        <span className="text-[11px] px-2 py-0.5 rounded-full" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}>
          Draft
        </span>
      </div>

      <ProductForm
        brands={(brands as unknown as { _id: { toString(): string }; name: string; slug: string }[]).map((b) => ({
          value: b._id.toString(),
          label: b.name,
          slug: b.slug,
        }))}
      />
    </div>
  );
}
