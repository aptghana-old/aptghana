import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, ResourceModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { ChevronLeft, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";

const TYPE_LABELS: Record<string, string> = {
  library: "Technical Library", "case-studies": "Case Studies", news: "News & Insights",
  training: "Product Training", cad: "CAD Downloads", certifications: "Certifications", other: "Other",
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const doc = await ResourceModel.findById(id).select("title").lean() as { title: string } | null;
    return { title: doc ? `${doc.title} — Resources` : "Resource" };
  } catch {
    return { title: "Resource" };
  }
}

type RawResourceDoc = {
  _id: unknown; title: string; slug: string; type: string;
  tagline?: string; intro?: string; isFeatured?: boolean; displayOrder?: number;
  status: string; updatedAt: Date;
  items?: { _id?: unknown; title?: string; description?: string; meta?: string }[];
  cta?: { label?: string; href?: string };
};

async function getData(id: string) {
  await connectDB();
  return ResourceModel.findById(id).lean() as Promise<RawResourceDoc | null>;
}

export default async function ResourceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getData(id);
  if (!doc) notFound();

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
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{doc.title}</h1>
        <div className="ml-auto flex items-center gap-2">
          <a href={`${SITE_URL}/resources/${doc.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />}>Preview</Button>
          </a>
          <Link href={`/dashboard/resources/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Intro */}
          {doc.intro && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Introduction</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>{doc.intro}</p>
            </div>
          )}

          {/* Items */}
          {(doc.items ?? []).length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Items ({(doc.items ?? []).length})
                </h2>
              </div>
              <table className="data-table">
                <thead><tr><th>Title</th><th className="hidden sm:table-cell">Meta</th></tr></thead>
                <tbody>
                  {(doc.items ?? []).map((item, i) => (
                    <tr key={String(item._id ?? i)}>
                      <td>
                        <div>
                          <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{item.title}</div>
                          {item.description && (
                            <div className="text-[11px] mt-0.5 line-clamp-2" style={{ color: "var(--apt-text-muted)" }}>{item.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="hidden sm:table-cell">
                        {item.meta && (
                          <span className="text-[11px] font-mono" style={{ color: "var(--apt-text-muted)" }}>{item.meta}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            <div className="text-[18px] font-bold mb-1" style={{ color: "var(--apt-text-primary)" }}>{doc.title}</div>
            <div className="font-mono text-[11px] mb-2" style={{ color: "var(--apt-text-muted)" }}>{doc.slug}</div>
            {doc.tagline && (
              <p className="text-[12px] mb-3" style={{ color: "var(--apt-text-secondary)" }}>{doc.tagline}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(doc.status)} dot>{doc.status}</Badge>
              <Badge variant="default">{TYPE_LABELS[doc.type] ?? doc.type}</Badge>
              {doc.isFeatured && <Badge variant="info">Featured</Badge>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Type</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{TYPE_LABELS[doc.type] ?? doc.type}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Items</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.items?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Display Order</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.displayOrder ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>CTA</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.cta?.label}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Updated</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>
                  {new Date(doc.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
