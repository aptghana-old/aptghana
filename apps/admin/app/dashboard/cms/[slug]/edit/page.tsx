import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { connectDB, SitePageModel } from "@apt/db";
import { Globe, ChevronRight } from "lucide-react";
import PageEditor, { type SitePageData } from "@/components/cms/PageEditor";

export const metadata: Metadata = { title: "Edit Page" };

const PAGE_LABELS: Record<string, string> = {
  privacy: "Privacy Policy",
  terms:   "Terms of Service",
  contact: "Contact",
};

async function getPage(slug: string): Promise<SitePageData | null> {
  try {
    await connectDB();
    const doc = await SitePageModel.findOne({ slug }).lean();
    if (!doc) return null;
    const d = doc as Record<string, unknown>;

    const sections = Array.isArray(d.sections)
      ? (d.sections as { heading?: string; body?: string }[]).map((s) => ({
          heading: (s.heading ?? "") as string,
          body:    (s.body    ?? "") as string,
        }))
      : [];

    const officeHours = Array.isArray(d.officeHours)
      ? (d.officeHours as { day?: string; hours?: string }[]).map((h) => ({
          day:   (h.day   ?? "") as string,
          hours: (h.hours ?? "") as string,
        }))
      : [];

    return {
      slug:         d.slug         as string,
      pageType:     d.pageType     as "legal" | "contact",
      title:        (d.title        ?? "") as string,
      tagline:      (d.tagline      ?? "") as string,
      description:  (d.description  ?? "") as string,
      lastUpdated:  (d.lastUpdated  ?? "") as string,
      intro:        (d.intro        ?? "") as string,
      sections,
      contactBlockName:     (d.contactBlockName     ?? "") as string,
      contactBlockEmail:    (d.contactBlockEmail    ?? "") as string,
      contactBlockAddress:  (d.contactBlockAddress  ?? "") as string,
      contactBlockFootnote: (d.contactBlockFootnote ?? "") as string,
      address:      (d.address      ?? "") as string,
      phone:        (d.phone        ?? "") as string,
      email:        (d.email        ?? "") as string,
      mapsUrl:      (d.mapsUrl      ?? "") as string,
      responseTime: (d.responseTime ?? "") as string,
      officeHours,
      metaTitle:       (d.metaTitle       ?? "") as string,
      metaDescription: (d.metaDescription ?? "") as string,
      status:          (d.status          ?? "published") as string,
    };
  } catch {
    return null;
  }
}

export default async function EditPageRoute({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = await getPage(slug);
  if (!page) notFound();

  const label = PAGE_LABELS[slug] ?? page.title;

  return (
    <div>
      <div className="card-header flex items-center gap-2 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
        <Link href="/dashboard/cms" className="flex items-center gap-1.5 hover:text-[var(--apt-text-primary)] transition-colors">
          <Globe size={13} />
          <span>Pages</span>
        </Link>
        <ChevronRight size={11} />
        <span style={{ color: "var(--apt-text-primary)" }}>{label}</span>
      </div>

      <div className="p-4 sm:p-6 max-w-3xl">
        <PageEditor initial={page} />
      </div>
    </div>
  );
}
