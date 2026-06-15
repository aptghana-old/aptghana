import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ServiceModel } from "@apt/db";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import ServiceForm from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "Edit Service" };

async function getService(id: string) {
  await connectDB();
  const doc = await ServiceModel.findById(id).lean();
  return doc as unknown as {
    _id: { toString(): string };
    title: string;
    slug: string;
    description?: string;
    section: string;
    iconName?: string;
    displayOrder?: number;
    status: string;
  } | null;
}

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getService(id);
  if (!doc) notFound();

  const initial = {
    title:        doc.title,
    slug:         doc.slug,
    description:  doc.description  ?? "",
    section:      doc.section,
    iconName:     doc.iconName     ?? "",
    displayOrder: doc.displayOrder ?? 0,
    status:       doc.status,
  };

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/services">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Services</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          Edit: {doc.title}
        </h1>
      </div>
      <div className="p-6 max-w-xl">
        <ServiceForm initial={initial} serviceId={id} />
      </div>
    </div>
  );
}
