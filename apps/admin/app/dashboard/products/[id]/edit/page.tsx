import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ProductModel, BrandModel, CategoryModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import ProductForm from "@/components/products/ProductForm";

export const metadata: Metadata = { title: "Edit Product" };

interface Props { params: Promise<{ id: string }> }

async function getPageData(id: string) {
  try {
    await connectDB();
    const [product, brands, categories] = await Promise.all([
      ProductModel.findById(id).lean(),
      BrandModel.find({ status: "active" }).select("_id name slug").sort({ name: 1 }).lean() as unknown as { _id: { toString(): string }; name: string; slug: string }[],
      CategoryModel.find({ status: "active" }).select("_id name slug depth").sort({ name: 1 }).lean() as unknown as { _id: { toString(): string }; name: string; slug: string; depth: number }[],
    ]);
    return { product, brands, categories };
  } catch {
    return { product: null, brands: [], categories: [] };
  }
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const { product: raw, brands, categories } = await getPageData(id);
  if (!raw) notFound();

  const p = raw as unknown as {
    _id: { toString(): string };
    name: string; sku: string; mpn?: string; slug: string;
    brandId?: string; categories?: { id: string }[];
    shortDescription?: string; description?: string;
    status: string;
    pricing?: { listPrice?: number; currency?: string };
    inventory?: { stockQty?: number };
    seo?: { metaTitle?: string; metaDescription?: string };
  };

  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href={`/dashboard/products/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Back to product</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold truncate flex-1" style={{ color: "var(--apt-text-primary)" }}>Edit: {p.name}</h1>
        <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
      </div>

      <ProductForm
        productId={id}
        brands={brands.map((b) => ({ value: b._id.toString(), label: b.name, slug: b.slug }))}
        categories={categories.map((c) => ({ value: c._id.toString(), label: c.name, slug: c.slug, depth: c.depth }))}
        initial={{
          name: p.name,
          sku: p.sku,
          mpn: p.mpn,
          slug: p.slug,
          brandId: p.brandId ?? "",
          categoryIds: p.categories?.map((c) => c.id) ?? [],
          shortDescription: p.shortDescription,
          description: p.description,
          status: p.status,
          listPrice: p.pricing?.listPrice?.toString() ?? "",
          currency: p.pricing?.currency ?? "GHS",
          stockQty: p.inventory?.stockQty?.toString() ?? "",
          metaTitle: p.seo?.metaTitle ?? "",
          metaDescription: p.seo?.metaDescription ?? "",
        }}
      />
    </div>
  );
}
