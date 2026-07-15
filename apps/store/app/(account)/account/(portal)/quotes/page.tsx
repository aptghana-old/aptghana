import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB, QuoteModel } from "@apt/db";
import { PageHeader, StatusBadge, EmptyState } from "@/components/account/ui";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";

export const metadata: Metadata = { title: "My Quotes" };

const RFQ_ICON = "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25M9 16.5v.75m3-3v3M15 12v5.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z";

interface QuoteListItem {
  _id: unknown;
  ref: string;
  quoteNumber?: string;
  status: string;
  source?: string;
  payToken?: string;
  totals?: { grandTotal?: number; currency?: string };
  expiresAt?: Date;
  items?: { name?: string; description?: string; quantity?: number }[];
  createdAt?: Date;
}

async function loadQuotes(userId: string, email: string): Promise<QuoteListItem[]> {
  try {
    await connectDB();
    return await QuoteModel.find({
      $or: [{ userId }, { "client.email": email.toLowerCase() }],
    })
      .select("ref quoteNumber status source payToken totals.grandTotal totals.currency expiresAt items.name items.description items.quantity createdAt")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean<QuoteListItem[]>();
  } catch (err) {
    console.error("[account quotes]", err);
    return [];
  }
}

function fmtDate(d?: Date): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default async function QuotesPage() {
  const session = await auth();
  const quotes = session?.user?.id
    ? await loadQuotes(session.user.id, session.user.email ?? "")
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Quotes"
        subtitle="Track and manage your Request for Quotation (RFQ) submissions."
        action={
          <Link href="/rfq" className="inline-flex items-center gap-1.5 h-9 px-4 bg-se-green hover:bg-se-green-hover text-white text-xs font-bold rounded-xl transition-colors">
            New RFQ
          </Link>
        }
      />

      {quotes.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl">
          <EmptyState
            icon={RFQ_ICON}
            title="No quotes submitted yet"
            description="Submit an RFQ to get competitive pricing on bulk orders, custom configurations, or unavailable products."
            action={
              <Link href="/rfq" className="inline-flex items-center gap-1.5 h-10 px-5 bg-navy-500 hover:bg-navy-400 text-white text-sm font-bold rounded-xl transition-colors">
                Request a Quote
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-hidden">
          {/* Desktop header */}
          <div
            className="hidden md:grid grid-cols-[140px_1fr_110px_110px_110px] gap-4 px-6 py-3 border-b border-(--border) bg-(--bg-raised) text-[11px] font-bold uppercase tracking-wider text-(--text-4)"
          >
            <span>Reference</span>
            <span>Products</span>
            <span>Submitted</span>
            <span>Source</span>
            <span>Status</span>
          </div>

          <ul className="divide-y divide-(--border)">
            {quotes.map((q) => {
              const items = q.items ?? [];
              const lineCount = items.length;
              const unitCount = items.reduce((n, i) => n + (i.quantity ?? 0), 0);
              const firstItem = items[0]?.name || items[0]?.description || "—";
              const statusLabel = QUOTE_STATUS_LABELS[q.status as QuoteStatus] ?? q.status;
              const payable = ["approved", "accepted"].includes(q.status) && q.payToken &&
                (!q.expiresAt || new Date(q.expiresAt) > new Date());
              return (
                <li key={String(q._id)}>
                  <div className="grid grid-cols-1 md:grid-cols-[140px_1fr_110px_110px_150px] gap-1.5 md:gap-4 px-5 md:px-6 py-4 items-center">
                    <div className="flex items-center justify-between md:block">
                      <span className="text-[13px] font-mono font-bold text-(--text-1)">{q.quoteNumber ?? q.ref}</span>
                      <span className="md:hidden"><StatusBadge status={q.status} label={statusLabel} /></span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-(--text-2) truncate">{firstItem}</p>
                      <p className="text-[11px] text-(--text-4)">
                        {lineCount} line item{lineCount !== 1 ? "s" : ""}
                        {unitCount > 0 ? ` · ${unitCount.toLocaleString()} units` : ""}
                        {q.totals?.grandTotal
                          ? ` · ${q.totals.currency ?? "GHS"} ${q.totals.grandTotal.toLocaleString()}`
                          : ""}
                      </p>
                    </div>
                    <span className="text-[12px] text-(--text-3)">{fmtDate(q.createdAt)}</span>
                    <span className="text-[12px] text-(--text-3) capitalize">
                      {q.source === "single_product" ? "Single product"
                        : q.source === "cart" ? "Procurement cart"
                        : q.source === "custom" ? "Custom products" : "—"}
                    </span>
                    <div className="flex items-center gap-2 md:justify-end">
                      <span className="hidden md:block"><StatusBadge status={q.status} label={statusLabel} /></span>
                      {payable && (
                        <Link
                          href={`/pay/${q.payToken}`}
                          className="inline-flex items-center h-7 px-3 rounded-lg text-[11px] font-bold text-white bg-se-green hover:bg-se-green-hover transition-colors"
                        >
                          Pay now
                        </Link>
                      )}
                      <a
                        href={`/api/documents/quote/${String(q._id)}?download=1`}
                        title="Download PDF"
                        className="inline-flex items-center h-7 px-2.5 rounded-lg text-[11px] font-bold border border-(--border) text-(--text-3) hover:border-navy-400 hover:text-navy-500 transition-colors"
                      >
                        PDF
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* How RFQ works */}
      <div className="bg-(--bg-surface) border border-(--border) rounded-2xl p-6">
        <h2 className="text-sm font-bold text-(--text-1) mb-4">How the RFQ process works</h2>
        <ol className="space-y-4">
          {[
            { n: "1", title: "Submit your RFQ", desc: "Provide product details, quantities, delivery requirements and any technical specifications." },
            { n: "2", title: "We prepare your quotation", desc: "Our technical team reviews your request and prepares a competitive, itemised quotation within one business day." },
            { n: "3", title: "Review and approve", desc: "You receive the quotation by email and can approve, negotiate, or request changes directly here." },
            { n: "4", title: "Order fulfilment", desc: "Once approved, your order is confirmed and processed with real-time updates sent to your account." },
          ].map((step) => (
            <li key={step.n} className="flex gap-4">
              <span className="w-7 h-7 rounded-full bg-navy-500/10 text-navy-500 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.n}</span>
              <div>
                <p className="text-sm font-semibold text-(--text-1)">{step.title}</p>
                <p className="text-xs text-(--text-3) mt-0.5">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
