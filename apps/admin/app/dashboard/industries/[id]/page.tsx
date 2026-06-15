import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, IndustryModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { ChevronLeft, Edit, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const doc = await IndustryModel.findById(id).select("name").lean() as { name: string } | null;
    return { title: doc ? `${doc.name} — Industries` : "Industry" };
  } catch {
    return { title: "Industry" };
  }
}

async function getData(id: string) {
  await connectDB();
  return IndustryModel.findById(id).lean() as Promise<any | null>;
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const doc = await getData(id);
  if (!doc) notFound();

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
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          {doc.icon} {doc.name}
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <a href={`${SITE_URL}/industries/${doc.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />}>Preview</Button>
          </a>
          <Link href={`/dashboard/industries/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">
          {/* Challenge */}
          {doc.challenge && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>The Challenge</h2>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>{doc.challenge}</p>
            </div>
          )}

          {/* Solutions */}
          {doc.solutions?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Solutions ({doc.solutions.length})
                </h2>
              </div>
              <div className="p-4 grid grid-cols-2 gap-2">
                {doc.solutions.map((sol: string) => (
                  <div key={sol} className="flex items-start gap-2 text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] shrink-0 mt-1.5" />
                    {sol}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Brands */}
          {doc.brands?.length > 0 && (
            <div className="card p-5">
              <h2 className="text-[14px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Key Brands</h2>
              <div className="flex flex-wrap gap-2">
                {doc.brands.map((brand: string) => (
                  <span key={brand} className="px-3 py-1 rounded-full text-[12px] font-medium" style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-primary)" }}>
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="card p-5">
            {doc.image?.url && (
              <div className="w-full h-24 rounded-lg border overflow-hidden mb-4" style={{ borderColor: "var(--apt-border)" }}>
                <img src={doc.image.url} alt={doc.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              {doc.icon && <span className="text-2xl">{doc.icon}</span>}
              <div className="text-[18px] font-bold" style={{ color: "var(--apt-text-primary)" }}>{doc.name}</div>
            </div>
            <div className="font-mono text-[11px] mb-2" style={{ color: "var(--apt-text-muted)" }}>{doc.slug}</div>
            {doc.tagline && (
              <p className="text-[12px] mb-3" style={{ color: "var(--apt-text-secondary)" }}>{doc.tagline}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(doc.status)} dot>{doc.status}</Badge>
              {doc.isFeatured && <Badge variant="info">Featured</Badge>}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Display Order</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.displayOrder ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Solutions</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.solutions?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Brands</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.brands?.length ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Accent</dt>
                <dd className="flex items-center gap-1.5" style={{ color: "var(--apt-text-primary)" }}>
                  {doc.accentColor && <span className="w-3 h-3 rounded-full inline-block border border-white/20" style={{ background: doc.accentColor }} />}
                  {doc.accentColor}
                </dd>
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
