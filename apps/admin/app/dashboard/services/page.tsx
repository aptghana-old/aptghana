import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, ServiceModel } from "@apt/db";
import { SITE_URL } from "@apt/config";
import { Briefcase, Plus, ExternalLink } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { SECTION_LABELS } from "@/components/services/ServiceForm";

export const metadata: Metadata = { title: "Services" };

interface ServiceRow {
  _id: string;
  title: string;
  slug: string;
  section: string;
  iconName: string;
  displayOrder: number;
  status: string;
}

const SECTION_ORDER = ["pillars", "technical", "what-we-offer", "pre-sales", "assembly"];

async function getServices(): Promise<ServiceRow[]> {
  try {
    await connectDB();
    const docs = await ServiceModel.find()
      .select("_id title slug section iconName displayOrder status")
      .sort({ section: 1, displayOrder: 1, title: 1 })
      .lean();

    type RawDoc = { _id: unknown; title: string; slug: string; section: string; iconName?: string; displayOrder?: number; status?: string };
    return (docs as unknown as RawDoc[]).map((d) => ({
      _id:          String(d._id),
      title:        d.title,
      slug:         d.slug,
      section:      d.section,
      iconName:     d.iconName ?? "",
      displayOrder: d.displayOrder ?? 0,
      status:       d.status ?? "active",
    }));
  } catch {
    return [];
  }
}

export default async function ServicesPage() {
  const services = await getServices();

  // Group by section
  const grouped = SECTION_ORDER.reduce<Record<string, ServiceRow[]>>((acc, sec) => {
    acc[sec] = services.filter((s) => s.section === sec);
    return acc;
  }, {});

  const total = services.length;

  return (
    <div>
      <PageHeader
        title="Services"
        description={`${total} service item${total !== 1 ? "s" : ""} across ${SECTION_ORDER.length} sections`}
        actions={
          <div className="flex items-center gap-2">
            <a href={`${SITE_URL}/services`} target="_blank" rel="noopener noreferrer">
              <Button variant="secondary" size="sm" icon={<ExternalLink size={13} />}>Preview</Button>
            </a>
            <Link href="/dashboard/services/new">
              <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Service</Button>
            </Link>
          </div>
        }
      />

      <div className="p-4 sm:p-6 space-y-6">
        {total === 0 ? (
          <div className="card">
            <EmptyState
              icon={<Briefcase size={22} />}
              title="No services yet"
              description="Run the seed script or add a service item to get started."
              action={
                <Link href="/dashboard/services/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Service</Button>
                </Link>
              }
            />
          </div>
        ) : (
          SECTION_ORDER.map((section) => {
            const items = grouped[section] ?? [];
            if (items.length === 0) return null;
            return (
              <div key={section} className="card overflow-hidden">
                <div className="card-header flex items-center justify-between">
                  <div>
                    <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                      {SECTION_LABELS[section] ?? section}
                    </h2>
                    <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                      {items.length} item{items.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <Link href={`/dashboard/services/new?section=${section}`}>
                    <Button variant="ghost" size="sm" icon={<Plus size={12} />}>Add</Button>
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Title</th>
                        <th className="hidden md:table-cell">Icon</th>
                        <th>Status</th>
                        <th className="w-px" />
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((svc) => (
                        <tr key={svc._id}>
                          <td>
                            <span className="tabular-nums text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                              {String(svc.displayOrder).padStart(2, "0")}
                            </span>
                          </td>
                          <td>
                            <Link
                              href={`/dashboard/services/${svc._id}/edit`}
                              className="text-[13px] font-medium hover:text-[#0057b8] transition-colors"
                              style={{ color: "var(--apt-text-primary)" }}
                            >
                              {svc.title}
                            </Link>
                            <div className="font-mono text-[10px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                              {svc.slug}
                            </div>
                          </td>
                          <td className="hidden md:table-cell">
                            <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>
                              {svc.iconName || "—"}
                            </span>
                          </td>
                          <td>
                            <Badge variant={statusVariant(svc.status)} dot>{svc.status}</Badge>
                          </td>
                          <td>
                            <Link
                              href={`/dashboard/services/${svc._id}/edit`}
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
            );
          })
        )}
      </div>
    </div>
  );
}
