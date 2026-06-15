import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ResourceModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ResourceForm from "@/components/resources/ResourceForm";

export const metadata: Metadata = { title: "Edit Resource" };

type RawResourceDoc = {
  _id: unknown; title: string; slug: string; type: string;
  tagline?: string; intro?: string; badge?: string;
  items?: { title?: string; description?: string; meta?: string; downloadUrl?: string; externalUrl?: string; tags?: string[] | string }[];
  cta?: { label?: string; href?: string };
  displayOrder?: number; isFeatured?: boolean; status: string;
};

async function getResource(id: string) {
  await connectDB();
  return ResourceModel.findById(id).lean() as Promise<RawResourceDoc | null>;
}

export default async function EditResourcePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getResource(id);
  if (!doc) notFound();

  const initial = {
    title: doc.title,
    slug: doc.slug,
    type: doc.type,
    tagline: doc.tagline ?? "",
    intro: doc.intro ?? "",
    badge: doc.badge ?? "",
    items: (doc.items ?? []).map((item) => ({
      title: item.title ?? "",
      description: item.description ?? "",
      meta: item.meta ?? "",
      downloadUrl: item.downloadUrl ?? "",
      externalUrl: item.externalUrl ?? "",
      tags: Array.isArray(item.tags) ? item.tags.join(", ") : (item.tags ?? ""),
    })),
    ctaLabel: doc.cta?.label ?? "Get in Touch",
    ctaHref: doc.cta?.href ?? "/contact",
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
        <Link href="/dashboard/resources">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Resources</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Edit: {doc.title}</h1>
      </div>
      <div className="p-6 max-w-2xl">
        <ResourceForm initial={initial} resourceId={id} />
      </div>
    </div>
  );
}
