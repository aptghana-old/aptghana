import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, ResourceModel } from "@apt/db";
import { BookOpen, Plus } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Resources" };

const TYPE_LABELS: Record<string, string> = {
  library: "Technical Library",
  "case-studies": "Case Studies",
  news: "News & Insights",
  training: "Product Training",
  cad: "CAD Downloads",
  certifications: "Certifications",
  other: "Other",
};

async function getResources() {
  try {
    await connectDB();
    const docs = await ResourceModel.find({ status: { $ne: "deleted" } })
      .sort({ displayOrder: 1, title: 1 })
      .select("_id slug type title tagline badge status displayOrder isFeatured updatedAt")
      .lean();
    return docs as unknown as {
      _id: { toString(): string };
      slug: string;
      type: string;
      title: string;
      tagline?: string;
      badge?: string;
      status: string;
      displayOrder: number;
      isFeatured?: boolean;
      updatedAt: Date;
    }[];
  } catch {
    return [];
  }
}

export default async function ResourcesPage() {
  const resources = await getResources();

  return (
    <div>
      <PageHeader
        title="Resources"
        description={`${resources.length} resource page${resources.length !== 1 ? "s" : ""}`}
        actions={
          <Link href="/dashboard/resources/new">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Add Resource
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {resources.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No resources yet"
              description="Create resource pages to publish technical documentation, case studies, and training."
              action={
                <Link href="/dashboard/resources/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                    Add first resource
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th className="hidden sm:table-cell">Type</th>
                    <th className="hidden sm:table-cell">Slug</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Order</th>
                    <th className="w-px" />
                  </tr>
                </thead>
                <tbody>
                  {resources.map((res) => (
                    <tr key={res._id.toString()}>
                      <td>
                        <Link
                          href={`/dashboard/resources/${res._id.toString()}`}
                          className="flex items-center gap-2 group"
                        >
                          <span
                            className="text-[13px] font-medium group-hover:text-[#0057b8] transition-colors"
                            style={{ color: "var(--apt-text-primary)" }}
                          >
                            {res.title}
                          </span>
                          {res.isFeatured && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#84CC16]/15 text-[#4a7c00]">
                              Featured
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {TYPE_LABELS[res.type] ?? res.type}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                          {res.slug}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(res.status)} dot>
                          {res.status}
                        </Badge>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-[12px] tabular-nums" style={{ color: "var(--apt-text-muted)" }}>
                          {res.displayOrder}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/resources/${res._id.toString()}/edit`}
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
          </div>
        )}
      </div>
    </div>
  );
}
