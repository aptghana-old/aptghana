import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, CategoryModel } from "@apt/db";
import { SITE_URL, SITE_DOMAIN } from "@apt/config";
import { Zap, Plus, ExternalLink } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Solutions" };

interface SolutionRow {
  _id: string;
  name: string;
  slug: string;
  shortDescription: string;
  status: string;
  displayOrder: number;
  productsCount: number;
  brandsCount: number;
  benefitsCount: number;
}

async function getSolutions(): Promise<SolutionRow[]> {
  try {
    await connectDB();
    const docs = await CategoryModel.find({ level: "group" })
      .select("_id name slug shortDescription status displayOrder products brands benefits")
      .sort({ displayOrder: 1, name: 1 })
      .lean();

    type RawDoc = { _id: unknown; name: string; slug: string; shortDescription?: string; status?: string; displayOrder?: number; products?: unknown[]; brands?: unknown[]; benefits?: unknown[] };
    return (docs as unknown as RawDoc[]).map((d) => ({
      _id: String(d._id),
      name: d.name,
      slug: d.slug,
      shortDescription: d.shortDescription ?? "",
      status: d.status ?? "active",
      displayOrder: d.displayOrder ?? 0,
      productsCount: (d.products ?? []).length,
      brandsCount: (d.brands ?? []).length,
      benefitsCount: (d.benefits ?? []).length,
    }));
  } catch {
    return [];
  }
}

export default async function SolutionsPage() {
  const solutions = await getSolutions();

  return (
    <div>
      <PageHeader
        title="Industrial Solutions"
        description={`End-to-end solution groups shown on ${SITE_DOMAIN}/solutions`}
        actions={
          <div className="flex items-center gap-2">
            <a href={`${SITE_URL}/solutions`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>
                Preview
              </Button>
            </a>
            <Link href="/dashboard/categories/new">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                New Solution Group
              </Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6">
        {solutions.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Zap size={22} />}
              title="No solution groups yet"
              description="Run the seed script or create a category with level Group to get started."
              action={
                <Link href="/dashboard/categories/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                    Create Solution Group
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
                    <th>Order</th>
                    <th>Solution</th>
                    <th>Tagline</th>
                    <th>Products</th>
                    <th>Brands</th>
                    <th>Benefits</th>
                    <th>Status</th>
                    <th className="w-px" />
                  </tr>
                </thead>
                <tbody>
                  {solutions.map((sol) => (
                    <tr key={sol._id}>
                      <td>
                        <span className="tabular-nums text-[12px] font-medium" style={{ color: "var(--apt-text-muted)" }}>
                          {String(sol.displayOrder).padStart(2, "0")}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/solutions/${sol._id}`}
                          className="flex items-center gap-2 group"
                        >
                          <Zap size={14} style={{ color: "var(--apt-text-brand)", flexShrink: 0 }} />
                          <span
                            className="text-[13px] font-medium group-hover:text-[#0057b8] transition-colors"
                            style={{ color: "var(--apt-text-primary)" }}
                          >
                            {sol.name}
                          </span>
                        </Link>
                        <span className="font-mono text-[11px] ml-6" style={{ color: "var(--apt-text-muted)" }}>
                          /{sol.slug}
                        </span>
                      </td>
                      <td>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {sol.shortDescription || "—"}
                        </span>
                      </td>
                      <td>
                        <span className="tabular-nums text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                          {sol.productsCount}
                        </span>
                      </td>
                      <td>
                        <span className="tabular-nums text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
                          {sol.brandsCount}
                        </span>
                      </td>
                      <td>
                        <span className="tabular-nums text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
                          {sol.benefitsCount}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(sol.status)} dot>
                          {sol.status}
                        </Badge>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Link
                            href={`/dashboard/solutions/${sol._id}/edit`}
                            className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
                            style={{ color: "var(--apt-text-muted)" }}
                          >
                            Edit
                          </Link>
                        </div>
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
