import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, SitePageModel } from "@apt/db";
import { SITE_URL, SITE_DOMAIN } from "@apt/config";
import {
  Globe, Home, Briefcase, Info, Mail, FileText,
  ExternalLink, Pencil,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = { title: "Pages" };

interface DbRow { slug: string; status: string; updatedAt: Date }

const STATUS_MAP: Record<string, "active" | "draft"> = {
  published: "active",
  draft: "draft",
};

const ICON_MAP: Record<string, React.ReactNode> = {
  "/": <Home size={15} />,
  "/solutions": <Briefcase size={15} />,
  "/industries": <Briefcase size={15} />,
  "/services": <Briefcase size={15} />,
  "/company": <Info size={15} />,
  "/contact": <Mail size={15} />,
  "/privacy": <FileText size={15} />,
  "/terms": <FileText size={15} />,
};

const PAGES = [
  { title: "Homepage", slug: "/", editable: false, dbSlug: null, note: "Composed from DB sections (solutions, industries, brands)" },
  { title: "Solutions", slug: "/solutions", editable: false, dbSlug: null, note: "Managed under Content → Solutions" },
  { title: "Industries", slug: "/industries", editable: false, dbSlug: null, note: "Managed under Content → Industries" },
  { title: "Services", slug: "/services", editable: false, dbSlug: null, note: "Managed under Content → Services" },
  { title: "Company", slug: "/company", editable: false, dbSlug: null, note: "Managed under Content → Company" },
  { title: "Contact", slug: "/contact", editable: true, dbSlug: "contact", note: null },
  { title: "Privacy Policy", slug: "/privacy", editable: true, dbSlug: "privacy", note: null },
  { title: "Terms of Service", slug: "/terms", editable: true, dbSlug: "terms", note: null },
];

async function getDbStatuses(): Promise<Record<string, DbRow>> {
  try {
    await connectDB();
    const docs = await SitePageModel.find()
      .select("slug status updatedAt")
      .lean() as unknown as { slug: string; status: string; updatedAt: Date }[];
    return Object.fromEntries(docs.map((d) => [ d.slug, d ]));
  } catch {
    return {};
  }
}

export default async function CmsPage() {
  const dbStatus = await getDbStatuses();

  return (
    <div>
      <PageHeader
        title="Pages"
        description={`Manage all ${SITE_DOMAIN} pages and their content.`}
      />
      <div className="p-6 space-y-4">
        <div className="card overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Page</th>
                <th className="hidden md:table-cell">URL</th>
                <th>Status</th>
                <th className="hidden lg:table-cell">Last Modified</th>
                <th className="w-px" />
              </tr>
            </thead>
            <tbody>
              {PAGES.map((page) => {
                const db = page.dbSlug ? dbStatus[ page.dbSlug ] : null;
                const status = db?.status ?? (page.editable ? "draft" : "published");
                const updatedAt = db?.updatedAt
                  ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(db.updatedAt))
                  : "—";

                return (
                  <tr key={page.slug}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
                          style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-muted)" }}
                        >
                          {ICON_MAP[ page.slug ] ?? <FileText size={15} />}
                        </div>
                        <div>
                          <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                            {page.title}
                          </div>
                          {page.note && (
                            <div className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                              {page.note}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell">
                      <a
                        href={`${SITE_URL}${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-[12px] hover:underline flex items-center gap-1"
                        style={{ color: "var(--apt-text-muted)" }}
                      >
                        {page.slug}
                        <ExternalLink size={10} />
                      </a>
                    </td>
                    <td>
                      <Badge variant={STATUS_MAP[ status ] ?? "default"} dot>
                        {status}
                      </Badge>
                    </td>
                    <td className="hidden lg:table-cell">
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                        {updatedAt}
                      </span>
                    </td>
                    <td>
                      {page.editable ? (
                        <Link href={`/dashboard/cms/${page.dbSlug}/edit`}>
                          <Button variant="ghost" size="xs" icon={<Pencil size={11} />}>Edit</Button>
                        </Link>
                      ) : (
                        <span className="text-[11px] px-2" style={{ color: "var(--apt-text-muted)" }}>
                          See note
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
