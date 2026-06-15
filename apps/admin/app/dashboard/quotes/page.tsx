import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, QuoteModel } from "@apt/db";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";
import { FileText, Clock, ArrowRight, Plus } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import ExportMenu from "@/components/exports/ExportMenu";

export const metadata: Metadata = { title: "Quotes & RFQs" };
export const revalidate = 30;

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function getQuotes(status?: string, page = 1) {
  try {
    await connectDB();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const [quotes, total] = await Promise.all([
      QuoteModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * 40).limit(40).lean(),
      QuoteModel.countDocuments(query),
    ]);
    return { quotes, total };
  } catch {
    return { quotes: [], total: 0 };
  }
}

async function getStatusCounts() {
  try {
    await connectDB();
    const agg = await QuoteModel.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]);
    return Object.fromEntries(agg.map((a) => [a._id, a.count])) as Record<string, number>;
  } catch {
    return {} as Record<string, number>;
  }
}

export default async function QuotesPage({ searchParams }: Props) {
  const { status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const [{ quotes, total }, counts] = await Promise.all([getQuotes(status, page), getStatusCounts()]);
  const grandTotal = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader
        title="Quotes & RFQs"
        description={`${total.toLocaleString()} quote${total !== 1 ? "s" : ""}`}
        actions={
          <div className="flex items-center gap-2">
            <ExportMenu datasets={[{ key: "quotes", label: "Quotes & RFQs" }]} />
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Create Quote
            </Button>
          </div>
        }
      />

      <div
        className="flex items-center gap-1 px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {[
          ["", "All", grandTotal],
          ["pending", "Pending Review", counts.pending],
          ["reviewing", "Under Review", counts.reviewing],
          ["waiting_customer", "Waiting for Customer", counts.waiting_customer],
          ["approved", "Awaiting Payment", counts.approved],
          ["paid", "Paid", counts.paid],
          ["processing", "Processing", counts.processing],
          ["shipped", "Shipped", counts.shipped],
          ["completed", "Completed", counts.completed],
          ["cancelled", "Cancelled", counts.cancelled],
          ["expired", "Expired", counts.expired],
        ].map(([val, label, count]) => (
          <Link
            key={String(val)}
            href={val ? `/dashboard/quotes?status=${val}` : "/dashboard/quotes"}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: status === val || (!status && !val) ? "var(--apt-bg-raised)" : "transparent",
              color: status === val || (!status && !val) ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
            }}
          >
            {label}
            {count ? <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--apt-border)", color: "var(--apt-text-muted)" }}>{count}</span> : null}
          </Link>
        ))}
      </div>

      <div className="p-6">
        {quotes.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<FileText size={22} />}
              title="No quotes yet"
              description="Customer RFQ submissions and manually created quotes appear here."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Customer</th>
                  <th>Company</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const quote = q as unknown as {
                    _id: { toString(): string };
                    ref: string;
                    kind?: string;
                    client: { name: string; company?: string; email?: string };
                    items: unknown[];
                    status: string;
                    createdAt: Date;
                  };
                  return (
                    <tr key={quote._id.toString()}>
                      <td>
                        <Link
                          href={`/dashboard/quotes/${quote._id.toString()}`}
                          className="font-mono text-[12px] hover:underline font-semibold"
                          style={{ color: "var(--apt-text-brand)" }}
                        >
                          {quote.ref}
                        </Link>
                        <div className="text-[10px] uppercase tracking-wide mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                          {quote.kind === "approval_request" ? "Approval Request" : "RFQ"}
                        </div>
                      </td>
                      <td>
                        <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{quote.client.name}</div>
                        {quote.client.email && <div className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{quote.client.email}</div>}
                      </td>
                      <td>
                        <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>
                          {quote.client.company ?? "—"}
                        </span>
                      </td>
                      <td>
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {quote.items.length} item{quote.items.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        <Badge variant={statusVariant(quote.status)} dot>
                          {QUOTE_STATUS_LABELS[quote.status as QuoteStatus] ?? quote.status}
                        </Badge>
                      </td>
                      <td>
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          <Clock size={11} />
                          {new Date(quote.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "2-digit" })}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/quotes/${quote._id.toString()}`}
                          className="inline-flex items-center gap-1 text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)]"
                          style={{ color: "var(--apt-text-muted)" }}
                        >
                          View <ArrowRight size={11} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
