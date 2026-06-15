import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, IndustryModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import IndustryForm from "@/components/industries/IndustryForm";

export const metadata: Metadata = { title: "Edit Industry" };

async function getIndustry(id: string) {
  await connectDB();
  return IndustryModel.findById(id).lean() as Promise<any | null>;
}

export default async function EditIndustryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getIndustry(id);
  if (!doc) notFound();

  const initial = {
    name: doc.name,
    slug: doc.slug,
    tagline: doc.tagline ?? "",
    shortDescription: doc.shortDescription ?? "",
    challenge: doc.challenge ?? "",
    solutions: (doc.solutions as string[])?.length ? doc.solutions : [""],
    brands: (doc.brands as string[])?.length ? doc.brands : [""],
    clients: doc.clients ?? "",
    icon: doc.icon ?? "",
    accentColor: doc.accentColor ?? "#84CC16",
    imageUrl: doc.image?.url ?? "",
    displayOrder: doc.displayOrder ?? 0,
    isFeatured: doc.isFeatured ?? false,
    status: doc.status,
  };

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/industries">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Industries</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Edit: {doc.name}</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <IndustryForm initial={initial} industryId={id} />
      </div>
    </div>
  );
}
