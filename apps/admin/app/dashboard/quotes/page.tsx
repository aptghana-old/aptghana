import type { Metadata } from "next";
import Link from "next/link";
import { hasPermission, type AdminRole } from "@apt/auth";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";
import { Plus } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import ExportMenu from "@/components/exports/ExportMenu";
import { auth } from "@/lib/auth";
import { getDealList, getDealKpis, getDealAnalytics, getDealFilterOptions, parseDealParams } from "@/lib/dealFilters";
import DealListShell from "@/components/deals/DealListShell";
import type { DealColumn } from "@/components/deals/DealTable";

export const metadata: Metadata = { title: "Quotes & RFQs" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 40;

const COLUMNS: DealColumn[] = [
  { key: "ref", label: "Reference", sortable: false },
  { key: "customer", label: "Customer" },
  { key: "company", label: "Company" },
  { key: "rep", label: "Sales Rep" },
  { key: "items", label: "Items", align: "right" },
  { key: "value", label: "Value", align: "right", sortable: true },
  { key: "status", label: "Status" },
  { key: "channel", label: "Channel", defaultVisible: false },
  { key: "expires", label: "Expires", defaultVisible: false },
  { key: "createdAt", label: "Submitted", sortable: true },
];

interface QuoteRow {
  _id: { toString(): string };
  ref: string;
  quoteNumber?: string;
  kind?: string;
  client: { name: string; company?: string; email?: string };
  items: unknown[];
  totals?: { grandTotal?: number; currency?: string };
  status: string;
  originChannel?: string;
  expiresAt?: string;
  salesRepName?: string;
  createdAt: string;
}

interface Props {
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function QuotesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const params = parseDealParams(sp);
  const page = Math.max(1, parseInt(sp.page ?? "1", 10));

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "quotes:edit");
  const canExport = hasPermission(role, overrides, "exports:run");

  const [{ rows, total }, kpis, analytics, options] = await Promise.all([
    getDealList("quote", params, page, PAGE_SIZE),
    getDealKpis("quote", params),
    getDealAnalytics("quote", params),
    getDealFilterOptions("quote"),
  ]);

  const typedRows = rows as unknown as QuoteRow[];

  function renderCell(q: QuoteRow, key: string): React.ReactNode {
    switch (key) {
      case "ref":
        return (
          <div>
            <Link href={`/dashboard/quotes/${q._id.toString()}`} className="font-mono text-[12px] hover:underline font-semibold" style={{ color: "var(--apt-text-brand)" }}>
              {q.quoteNumber ?? q.ref}
            </Link>
            <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
              {q.kind === "approval_request" ? "Approval Request" : "RFQ"}
            </div>
          </div>
        );
      case "customer":
        return (
          <div>
            <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{q.client.name}</div>
            {q.client.email && <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{q.client.email}</div>}
          </div>
        );
      case "company":
        return <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{q.client.company ?? "—"}</span>;
      case "rep":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{q.salesRepName ?? "—"}</span>;
      case "items":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{q.items.length}</span>;
      case "value":
        return q.totals?.grandTotal ? (
          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>{q.totals.currency ?? "GHS"} {q.totals.grandTotal.toLocaleString()}</span>
        ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>;
      case "status":
        return <Badge variant={statusVariant(q.status)} dot>{QUOTE_STATUS_LABELS[q.status as QuoteStatus] ?? q.status}</Badge>;
      case "channel":
        return <span className="text-[12px] capitalize" style={{ color: "var(--apt-text-muted)" }}>{q.originChannel ?? "—"}</span>;
      case "expires":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{q.expiresAt ? new Date(q.expiresAt).toLocaleDateString("en-GH") : "—"}</span>;
      case "createdAt":
        return <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(q.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "2-digit" })}</span>;
      default:
        return null;
    }
  }

  return (
    <div>
      <PageHeader
        title="Quotes & RFQs"
        description={`${total.toLocaleString()} quote${total !== 1 ? "s" : ""} matching your filters`}
        actions={
          <div className="flex items-center gap-2">
            {canExport && <ExportMenu datasets={[{ key: "quotes", label: "Quotes & RFQs" }]} inheritParams={["status", "preset", "salesRep", "currency"]} />}
            {canEdit && (
              <Link href="/dashboard/customers">
                <Button variant="primary" size="sm" icon={<Plus size={13} />}>Create Quote</Button>
              </Link>
            )}
          </div>
        }
      />

      <DealListShell
        kind="quote"
        options={options}
        current={sp}
        storageNamespace="quotes"
        kpis={kpis}
        currency={options.currencies[0] ?? "GHS"}
        analytics={analytics}
        columns={COLUMNS}
        rows={typedRows}
        rowKey={(q) => q._id.toString()}
        renderCell={renderCell}
        total={total}
        page={page}
        pageSize={PAGE_SIZE}
        bulkEndpoint={canEdit ? "/api/quotes/bulk" : undefined}
        bulkStatusOptions={canEdit ? [{ value: "cancelled", label: "Cancelled" }, { value: "expired", label: "Expired" }] : undefined}
      />
    </div>
  );
}
