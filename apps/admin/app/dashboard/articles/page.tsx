import type { Metadata } from "next";
import Link from "next/link";
import { hasPermission, type AdminRole } from "@apt/auth";
import { Plus, Star } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/analytics/primitives";
import { formatNumber } from "@/lib/analytics/range";
import ExportMenu from "@/components/exports/ExportMenu";
import { auth } from "@/lib/auth";
import { getArticleList, getArticleKpis, getArticleFilterOptions, parseArticleParams } from "@/lib/articleFilters";
import ArticleListShell from "@/components/articles/ArticleListShell";
import type { DealColumn, DealTableRow } from "@/components/deals/DealTable";

export const metadata: Metadata = { title: "Articles" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const COLUMNS: DealColumn[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "status", label: "Status" },
  { key: "category", label: "Category" },
  { key: "author", label: "Author" },
  { key: "featured", label: "Featured" },
  { key: "views", label: "Views", align: "right", sortable: true },
  { key: "publishDate", label: "Publish Date", sortable: true },
  { key: "updatedAt", label: "Updated", sortable: true },
];

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ArticlesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseArticleParams(sp);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "content:edit");
  const canExport = hasPermission(role, overrides, "exports:run");

  const [{ rows, total }, kpis, options] = await Promise.all([
    getArticleList(params, page, PAGE_SIZE),
    getArticleKpis(params),
    getArticleFilterOptions(),
  ]);

  function renderCell(a: typeof rows[number], key: string): React.ReactNode {
    switch (key) {
      case "title":
        return (
          <Link href={`/dashboard/articles/${a._id.toString()}`} className="text-[13px] font-medium hover:underline" style={{ color: "var(--apt-text-primary)" }}>
            {a.title}
          </Link>
        );
      case "status":
        return <Badge variant={statusVariant(a.status)} dot>{a.status}</Badge>;
      case "category":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{a.category ?? "—"}</span>;
      case "author":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{a.authorName ?? "—"}</span>;
      case "featured":
        return a.featured ? <Star size={13} fill="#f59e0b" style={{ color: "#f59e0b" }} /> : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>;
      case "views":
        return <span className="text-[13px] tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{(a.viewCount ?? 0).toLocaleString()}</span>;
      case "publishDate":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{a.publishDate ? new Date(a.publishDate).toLocaleDateString("en-GH") : "—"}</span>;
      case "updatedAt":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(a.updatedAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "2-digit" })}</span>;
      default:
        return null;
    }
  }

  const tableRows: DealTableRow[] = rows.map((a) => ({
    id: a._id.toString(),
    cells: Object.fromEntries(COLUMNS.map((c) => [c.key, renderCell(a, c.key)])),
  }));

  return (
    <div>
      <PageHeader
        title="Articles"
        description={`${total.toLocaleString()} article${total !== 1 ? "s" : ""} matching your filters`}
        actions={
          <div className="flex items-center gap-2">
            {canExport && <ExportMenu datasets={[{ key: "articles", label: "Articles" }]} inheritParams={["status", "author", "category", "preset"]} />}
            {canEdit && (
              <Link href="/dashboard/articles/new">
                <Button variant="primary" size="sm" icon={<Plus size={13} />}>New Article</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 sm:p-6 pb-0">
        <StatCard label="Total Articles" value={formatNumber(kpis.total)} accent="#0EA5E9" />
        <StatCard label="Published" value={formatNumber(kpis.published)} accent="#00B37E" />
        <StatCard label="Drafts" value={formatNumber(kpis.drafts)} accent="#A78BFA" />
        <StatCard label="Scheduled" value={formatNumber(kpis.scheduled)} accent="#F59E0B" />
        <StatCard label="Views" value={formatNumber(kpis.totalViews)} accent="#F472B6" />
        <StatCard label="Avg. Read Time" value={`${kpis.avgReadTime} min`} accent="#00D68F" />
      </div>

      <ArticleListShell
        options={options}
        current={sp}
        columns={COLUMNS}
        rows={tableRows}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        canEdit={canEdit}
      />
    </div>
  );
}
