import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, IndustryModel } from "@apt/db";
import { Globe, Plus } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Industries" };

async function getIndustries() {
  try {
    await connectDB();
    const docs = await IndustryModel.find({ status: { $ne: "deleted" } })
      .sort({ displayOrder: 1, name: 1 })
      .select("_id slug name tagline status displayOrder isFeatured accentColor icon updatedAt")
      .lean();
    return docs as unknown as {
      _id: { toString(): string };
      slug: string;
      name: string;
      tagline?: string;
      status: string;
      displayOrder: number;
      isFeatured?: boolean;
      accentColor?: string;
      icon?: string;
      updatedAt: Date;
    }[];
  } catch {
    return [];
  }
}

export default async function IndustriesPage() {
  const industries = await getIndustries();

  return (
    <div>
      <PageHeader
        title="Industries"
        description={`${industries.length} industr${industries.length !== 1 ? "ies" : "y"} configured`}
        actions={
          <Link href="/dashboard/industries/new">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Add Industry
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {industries.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Globe size={22} />}
              title="No industries yet"
              description="Add industry pages to let customers navigate by sector."
              action={
                <Link href="/dashboard/industries/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                    Add first industry
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
                    <th>Industry</th>
                    <th className="hidden sm:table-cell">Slug</th>
                    <th className="hidden md:table-cell">Tagline</th>
                    <th>Status</th>
                    <th className="hidden sm:table-cell">Order</th>
                    <th className="w-px" />
                  </tr>
                </thead>
                <tbody>
                  {industries.map((ind) => (
                    <tr key={ind._id.toString()}>
                      <td>
                        <Link
                          href={`/dashboard/industries/${ind._id.toString()}`}
                          className="flex items-center gap-2.5 group"
                        >
                          {ind.icon && <span className="text-lg leading-none">{ind.icon}</span>}
                          <span
                            className="text-[13px] font-medium group-hover:text-[#0057b8] transition-colors"
                            style={{ color: "var(--apt-text-primary)" }}
                          >
                            {ind.name}
                          </span>
                          {ind.isFeatured && (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[#84CC16]/15 text-[#4a7c00]">
                              Featured
                            </span>
                          )}
                        </Link>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                          {ind.slug}
                        </span>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-[12px] truncate max-w-[200px] block" style={{ color: "var(--apt-text-muted)" }}>
                          {ind.tagline}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(ind.status)} dot>
                          {ind.status}
                        </Badge>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-[12px] tabular-nums" style={{ color: "var(--apt-text-muted)" }}>
                          {ind.displayOrder}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/industries/${ind._id.toString()}/edit`}
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
