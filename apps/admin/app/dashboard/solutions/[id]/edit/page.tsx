import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, CategoryModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import CategoryForm from "@/components/categories/CategoryForm";

export const metadata: Metadata = { title: "Edit Solution" };

async function getSolution(id: string) {
  await connectDB();
  const doc = await CategoryModel.findById(id).lean();
  return doc as unknown as {
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
    benefits?: { title: string; value: string }[];
    bulletPoints?: string[];
    products?: string[];
    brands?: string[];
    applications?: string[];
  } | null;
}

export default async function EditSolutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getSolution(id);
  if (!doc) notFound();

  const initial = {
    name:             doc.name,
    slug:             doc.slug,
    shortDescription: doc.shortDescription  ?? "",
    description:      doc.description       ?? "",
    level:            doc.level,
    status:           doc.status,
    isFeatured:       doc.isFeatured        ?? false,
    displayOrder:     doc.displayOrder       ?? 0,
    imageUrl:         doc.image?.url         ?? "",
    benefits:         doc.benefits           ?? [],
    bulletPoints:     doc.bulletPoints       ?? [],
    products:         doc.products           ?? [],
    brands:           doc.brands             ?? [],
    applications:     doc.applications       ?? [],
  };

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href={`/dashboard/solutions/${id}`}>
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>
            {doc.name}
          </Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          Edit Solution
        </h1>
      </div>
      <div className="p-6 max-w-2xl">
        <CategoryForm initial={initial} categoryId={id} />
      </div>
    </div>
  );
}
