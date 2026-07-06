import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, CategoryModel, ProductModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { ChevronLeft, Edit, Package, FolderTree, ExternalLink, Zap, Tag, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";

interface SolutionDoc {
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
  createdAt: Date;
  updatedAt: Date;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  try {
    await connectDB();
    const doc = await CategoryModel.findById(id).select("name").lean() as { name: string } | null;
    return { title: doc ? `${doc.name} — Solutions` : "Solution" };
  } catch {
    return { title: "Solution" };
  }
}

async function getData(id: string) {
  await connectDB();
  const [ doc, children ] = await Promise.all([
    CategoryModel.findById(id).lean(),
    CategoryModel.find({ parentId: id }).select("name slug status level displayOrder").sort({ displayOrder: 1, name: 1 }).lean(),
  ]);
  return {
    doc: doc as unknown as SolutionDoc | null,
    children: children as unknown as { _id: { toString(): string }; name: string; slug: string; status: string; level: string }[],
  };
}

const LEVEL_LABEL: Record<string, string> = {
  group: "Group",
  category: "Category",
  subcategory: "Subcategory",
  range: "Range",
};

export default async function SolutionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { doc, children } = await getData(id);
  if (!doc) notFound();

  const benefits = doc.benefits ?? [];
  const bulletPoints = doc.bulletPoints ?? [];
  const products = doc.products ?? [];
  const brands = doc.brands ?? [];
  const applications = doc.applications ?? [];

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/solutions">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Solutions</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <Zap size={15} style={{ color: "var(--apt-text-brand)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{doc.name}</h1>
        <div className="ml-auto flex items-center gap-2">
          <a href={`${SITE_URL}/solutions/${doc.slug}`} target="_blank" rel="noopener noreferrer">
            <Button variant="ghost" size="sm" icon={<ExternalLink size={13} />}>Preview</Button>
          </a>
          <Link href={`/dashboard/solutions/${id}/edit`}>
            <Button variant="secondary" size="sm" icon={<Edit size={13} />}>Edit</Button>
          </Link>
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main column */}
        <div className="lg:col-span-2 space-y-5">

          {/* Benefits */}
          {benefits.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header">
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Benefits ({benefits.length})
                </h2>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
                {benefits.map((b, i) => (
                  <div key={i} className="px-5 py-4">
                    <div className="text-[13px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>{b.title}</div>
                    <div className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{b.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {products.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center gap-2">
                <Package size={14} style={{ color: "var(--apt-text-muted)" }} />
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Products & Components ({products.length})
                </h2>
              </div>
              <div className="px-5 py-4">
                <div className="flex flex-wrap gap-2">
                  {products.map((p, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center px-2.5 py-1 rounded-md text-[12px]"
                      style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Sub-solutions (children) */}
          {children.length > 0 && (
            <div className="card overflow-hidden">
              <div className="card-header flex items-center gap-2">
                <FolderTree size={14} style={{ color: "var(--apt-text-muted)" }} />
                <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Sub-Solutions ({children.length})
                </h2>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Level</th>
                    <th>Status</th>
                    <th className="w-px" />
                  </tr>
                </thead>
                <tbody>
                  {children.map((c) => (
                    <tr key={c._id.toString()}>
                      <td>
                        <Link href={`/dashboard/categories/${c._id.toString()}`} className="flex items-center gap-2 group">
                          <FolderTree size={13} style={{ color: "var(--apt-text-muted)" }} />
                          <span
                            className="text-[13px] group-hover:text-[#0057b8] transition-colors"
                            style={{ color: "var(--apt-text-primary)" }}
                          >
                            {c.name}
                          </span>
                        </Link>
                      </td>
                      <td>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {LEVEL_LABEL[ c.level ] ?? c.level}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(c.status)} dot>{c.status}</Badge>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/categories/${c._id.toString()}/edit`}
                          className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                          style={{ color: "var(--apt-text-muted)" }}
                        >
                          Edit
                        </Link>
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
          {/* Identity card */}
          <div className="card p-5">
            {doc.image?.url && (
              <div className="w-full h-24 rounded-lg border overflow-hidden mb-4" style={{ borderColor: "var(--apt-border)" }}>
                <img src={doc.image.url} alt={doc.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="text-[18px] font-bold mb-0.5" style={{ color: "var(--apt-text-primary)" }}>{doc.name}</div>
            <div className="font-mono text-[11px] mb-2" style={{ color: "var(--apt-text-muted)" }}>/{doc.slug}</div>
            {doc.shortDescription && (
              <p className="text-[12px] mb-3" style={{ color: "var(--apt-text-secondary)" }}>{doc.shortDescription}</p>
            )}
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariant(doc.status)} dot>{doc.status}</Badge>
              <Badge variant="default">Group</Badge>
              {doc.isFeatured && <Badge variant="info">Featured</Badge>}
            </div>
          </div>

          {/* Brands */}
          {brands.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Tag size={13} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Brands ({brands.length})
                </h3>
              </div>
              <div className="space-y-1.5">
                {brands.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] shrink-0" />
                    <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Applications */}
          {applications.length > 0 && (
            <div className="card p-5">
              <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>
                Applications ({applications.length})
              </h3>
              <div className="space-y-1.5">
                {applications.map((a, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: "var(--apt-text-muted)" }} />
                    <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bullet points */}
          {bulletPoints.length > 0 && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckSquare size={13} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                  Why APT Ghana ({bulletPoints.length})
                </h3>
              </div>
              <ul className="space-y-1.5">
                {bulletPoints.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84CC16] shrink-0 mt-1.5" />
                    <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Meta */}
          <div className="card p-5">
            <h3 className="text-[13px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>Details</h3>
            <dl className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Display Order</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{doc.displayOrder ?? 0}</dd>
              </div>
              <div className="flex justify-between text-[12px]">
                <dt style={{ color: "var(--apt-text-muted)" }}>Sub-solutions</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{children.length}</dd>
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
