import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, CompanyPageModel, CompanyStatModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { Building2, Plus, ExternalLink } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import CompanyStatsEditor from "@/components/company/CompanyStatsEditor";

export const metadata: Metadata = { title: "Company" };

interface PageRow {
  _id:            string;
  title:          string;
  slug:           string;
  tagline:        string;
  icon:           string;
  displayOrder:   number;
  status:         string;
  sectionCount:   number;
}

interface StatRow {
  _id:          string;
  value:        string;
  label:        string;
  displayOrder: number;
  status:       string;
}

async function getData(): Promise<{ pages: PageRow[]; stats: StatRow[] }> {
  try {
    await connectDB();
    const [rawPages, rawStats] = await Promise.all([
      CompanyPageModel.find()
        .select("_id title slug tagline icon displayOrder status sections")
        .sort({ displayOrder: 1, title: 1 })
        .lean(),
      CompanyStatModel.find()
        .select("_id value label displayOrder status")
        .sort({ displayOrder: 1 })
        .lean(),
    ]);

    type RawPage = { _id: unknown; title: string; slug: string; tagline?: string; icon?: string; displayOrder?: number; status?: string; sections?: unknown[] };
    const pages: PageRow[] = (rawPages as unknown as RawPage[]).map((d) => ({
      _id:          String(d._id),
      title:        d.title,
      slug:         d.slug,
      tagline:      d.tagline ?? "",
      icon:         d.icon ?? "",
      displayOrder: d.displayOrder ?? 0,
      status:       d.status ?? "active",
      sectionCount: Array.isArray(d.sections) ? d.sections.length : 0,
    }));

    type RawStat = { _id: unknown; value: string; label: string; displayOrder?: number; status?: string };
    const stats: StatRow[] = (rawStats as unknown as RawStat[]).map((d) => ({
      _id:          String(d._id),
      value:        d.value,
      label:        d.label,
      displayOrder: d.displayOrder ?? 0,
      status:       d.status ?? "active",
    }));

    return { pages, stats };
  } catch {
    return { pages: [], stats: [] };
  }
}

export default async function CompanyPage() {
  const { pages, stats } = await getData();

  return (
    <div>
      <PageHeader
        title="Company"
        description={`${pages.length} sub-page${pages.length !== 1 ? "s" : ""} · ${stats.length} stat${stats.length !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <a href={`${SITE_URL}/company`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>Preview</Button>
            </a>
            <Link href="/dashboard/company/new">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Page</Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {/* Sub-pages table */}
        <div className="card overflow-hidden">
          <div className="card-header flex items-center justify-between">
            <div>
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Sub-Pages
              </h2>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                Shown as navigation cards on /company
              </p>
            </div>
            <Link href="/dashboard/company/new">
              <Button variant="ghost" size="sm" icon={<Plus size={12} />}>Add</Button>
            </Link>
          </div>

          {pages.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={<Building2 size={22} />}
                title="No company pages yet"
                description="Run the seed script or add a page to get started."
                action={
                  <Link href="/dashboard/company/new">
                    <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Page</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Page</th>
                    <th className="hidden md:table-cell">Tagline</th>
                    <th className="hidden sm:table-cell">Sections</th>
                    <th>Status</th>
                    <th className="w-px" />
                  </tr>
                </thead>
                <tbody>
                  {pages.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <span className="tabular-nums text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {String(p.displayOrder).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/company/${p._id}/edit`}
                          className="flex items-center gap-2 text-[13px] font-medium hover:text-[#0057b8] transition-colors"
                          style={{ color: "var(--apt-text-primary)" }}
                        >
                          {p.icon && <span className="text-lg leading-none">{p.icon}</span>}
                          <div>
                            <div>{p.title}</div>
                            <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                              /company/{p.slug}
                            </div>
                          </div>
                        </Link>
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {p.tagline || "—"}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {p.sectionCount}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(p.status)} dot>{p.status}</Badge>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/company/${p._id}/edit`}
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

        {/* Stats */}
        <div className="card p-5">
          <div className="mb-4">
            <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
              Company Stats
            </h2>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
              Shown in the stats banner on /company (e.g. "2009 — Year Founded")
            </p>
          </div>
          <CompanyStatsEditor initialStats={stats} />
        </div>
      </div>
    </div>
  );
}
