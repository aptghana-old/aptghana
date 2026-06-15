import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB, CompanyPageModel } from "@apt/db";
import { Building2, ChevronRight } from "lucide-react";
import CompanyPageForm from "@/components/company/CompanyPageForm";

export const metadata: Metadata = { title: "Edit Company Page" };

async function getPage(id: string) {
  try {
    await connectDB();
    const doc = await CompanyPageModel.findById(id).lean();
    if (!doc) return null;
    const d = doc as unknown as {
      _id: unknown; title: string; slug: string; tagline?: string; icon?: string;
      cardDescription?: string; intro?: string; sections?: unknown[];
      ctaLabel?: string; ctaHref?: string; displayOrder?: number; status?: string;
    };
    return {
      _id:            String(d._id),
      title:          d.title           as string,
      slug:           d.slug            as string,
      tagline:        (d.tagline  ?? "") as string,
      icon:           (d.icon     ?? "") as string,
      cardDescription:(d.cardDescription ?? "") as string,
      intro:          (d.intro    ?? "") as string,
      sections:       (Array.isArray(d.sections) ? d.sections : []) as { heading: string; body: string }[],
      ctaLabel:       (d.ctaLabel ?? "Get in Touch") as string,
      ctaHref:        (d.ctaHref  ?? "/contact") as string,
      displayOrder:   (d.displayOrder ?? 0) as number,
      status:         (d.status   ?? "active") as string,
    };
  } catch {
    return null;
  }
}

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const page = await getPage(id);
  if (!page) notFound();

  return (
    <div>
      <div className="card-header flex items-center gap-2 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        <Link href="/dashboard/company" className="flex items-center gap-1.5 hover:text-[var(--apt-text-primary)] transition-colors">
          <Building2 size={13} />
          <span>Company</span>
        </Link>
        <ChevronRight size={11} />
        <span style={{ color: "var(--apt-text-primary)" }}>{page.title}</span>
      </div>

      <div className="p-4 sm:p-6 max-w-3xl">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            {page.icon && <span className="text-2xl">{page.icon}</span>}
            <h1 className="text-[18px] font-bold" style={{ color: "var(--apt-text-primary)" }}>
              {page.title}
            </h1>
          </div>
          <p className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            /company/{page.slug}
          </p>
        </div>

        <CompanyPageForm
          pageId={page._id}
          initial={{
            title:           page.title,
            slug:            page.slug,
            tagline:         page.tagline,
            icon:            page.icon,
            cardDescription: page.cardDescription,
            intro:           page.intro,
            sections:        page.sections,
            ctaLabel:        page.ctaLabel,
            ctaHref:         page.ctaHref,
            displayOrder:    page.displayOrder,
            status:          page.status,
          }}
        />
      </div>
    </div>
  );
}
