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

interface Props {
  searchParams: Promise<{ name?: string }>;
}

export default async function NewProductPage({ searchParams }: Props) {
  const { name } = await searchParams;
  const { brands } = await getFormData();

  return (
    <div>
      {/* ── Back bar ── */}
      <div
        className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/products">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>
            Products
          </Button>
        </Link>
        <div className="hidden sm:block" style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <span
          className="ml-auto text-[11px] px-2 py-0.5 rounded-full"
          style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
        >
          Draft
        </span>
      </div>

      {/* ── Header band ── */}
      <div className="px-4 sm:px-6 pt-5 pb-5" style={{ background: "var(--apt-bg)", borderBottom: "1px solid var(--apt-border)" }}>
        <div className="max-w-[1400px]">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>
            New product
          </p>
          <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight leading-tight" style={{ color: "var(--apt-text-primary)" }}>
            {name?.trim() || "Untitled product"}
          </h1>
        </div>
      </div>

      <ProductForm
        brands={(brands as unknown as { _id: { toString(): string }; name: string; slug: string }[]).map((b) => ({
          value: b._id.toString(),
          label: b.name,
          slug: b.slug,
        }))}
        initial={name ? { name } : undefined}
      />
    </div>
  );
}
