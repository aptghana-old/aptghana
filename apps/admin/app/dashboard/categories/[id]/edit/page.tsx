import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, CategoryModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CategoryForm from "@/components/categories/CategoryForm";

export const metadata: Metadata = { title: "Edit Category" };

async function getCategory(id: string) {
  await connectDB();
  const cat = await CategoryModel.findById(id).lean();
  return cat as unknown as {
    _id: { toString(): string };
    name: string;
    slug: string;
    shortDescription?: string;
    description?: string;
    level: string;
    status: string;
    isFeatured?: boolean;
    displayOrder?: number;
    image?: { url?: string };
    icon?: string;
    documents?: { type: string; title: string; url: string; language: string }[];
    benefits?: { title: string; value: string }[];
    bulletPoints?: string[];
    products?: string[];
    brands?: string[];
    applications?: string[];
    seo?: { title?: string; description?: string };
  } | null;
}

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const cat = await getCategory(id);
  if (!cat) notFound();

  const initial = {
    name:             cat.name,
    slug:             cat.slug,
    shortDescription: cat.shortDescription  ?? "",
    description:      cat.description       ?? "",
    level:            cat.level,
    status:           cat.status,
    isFeatured:       cat.isFeatured        ?? false,
    displayOrder:     cat.displayOrder       ?? 0,
    imageUrl:         cat.image?.url         ?? "",
    icon:             cat.icon               ?? "",
    documents:        cat.documents          ?? [],
    benefits:         cat.benefits           ?? [],
    bulletPoints:     cat.bulletPoints       ?? [],
    products:         cat.products           ?? [],
    brands:           cat.brands             ?? [],
    applications:     cat.applications       ?? [],
    seoTitle:         cat.seo?.title         ?? "",
    seoDescription:   cat.seo?.description   ?? "",
  };

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/categories">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Categories</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          Edit: {cat.name}
        </h1>
      </div>
      <div className="p-6 max-w-2xl">
        <CategoryForm initial={initial} categoryId={id} />
      </div>
    </div>
  );
}
