import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, QuoteModel } from "@apt/db";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";
import PayButton from "@/components/pay/PayButton";

export const metadata: Metadata = {
  title: "Secure Payment | APT Ghana",
  description: "Review and pay your approved APT Ghana quotation securely.",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}

interface QuoteDoc {
  _id: { toString(): string };
  ref: string;
  quoteNumber?: string;
  client: { name: string; firstName?: string; email: string; company?: string };
  items: {
    sku?: string; name?: string; brand?: string; image?: string;
    description: string; quantity: number; unitPrice?: number; lineTotal?: number; notes?: string;
  }[];
  status: QuoteStatus;
  paymentStatus?: string;
  totals?: {
    subtotal: number; discount: number; taxRate: number;
    taxAmount: number; shipping: number; grandTotal: number; currency: string;
  };
  quoteNote?: string;
  expiresAt?: Date;
  approvedAt?: Date;
  payment?: { reference?: string; channel?: string; paidAt?: Date; amount?: number };
}

function fmt(n: number, cur: string) {
  return `${cur} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(d?: Date) {
  return d ? new Date(d).toLocaleDateString("en-GH", { day: "numeric", month: "long", year: "numeric" }) : "—";
}

/* ─── Small pieces ────────────────────────────────────────────────────────── */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}
    >
      {children}
    </div>
  );
}

function StatusScreen({ icon, title, children }: {
  icon: "lock" | "check" | "clock";
  title: string;
  children: React.ReactNode;
}) {
  const paths = {
    lock:  "M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z",
    check: "M4.5 12.75l6 6 9-13.5",
    clock: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  };
  return (
    <div className="max-w-md mx-auto text-center py-16">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "var(--bg-raised)" }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className="text-(--text-4)" aria-hidden>
          <path d={paths[icon]} />
        </svg>
      </div>
      <h1 className="text-xl font-bold text-(--text-1) mb-2">{title}</h1>
      <div className="text-sm text-(--text-3) space-y-3">{children}</div>
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────────────────────────── */
export default async function PayPage({ params, searchParams }: Props) {
  const { token } = await params;
  const { status: cbStatus } = await searchParams;

  if (!/^[a-f0-9]{48}$/.test(token)) notFound();

  let quote: (QuoteDoc & { payToken?: string }) | null = null;
  try {
    await connectDB();
    quote = await QuoteModel.findOne({ payToken: token }).lean<QuoteDoc & { payToken?: string }>();
  } catch (err) {
    console.error("[pay page]", err);
  }
  // Defense in depth: never trust the filter alone — the stored token must match
  if (!quote || quote.payToken !== token) notFound();

  const totals = quote.totals;
  const isPaid = quote.paymentStatus === "paid" || quote.status === "paid" ||
    ["processing", "ready_for_delivery", "shipped", "delivered", "completed"].includes(quote.status);
  const isApproved = ["approved", "accepted"].includes(quote.status);
  const isExpired = !isPaid && (quote.status === "expired" ||
    Boolean(quote.expiresAt && new Date(quote.expiresAt) < new Date()));
  const payable = isApproved && !isExpired && !isPaid && (totals?.grandTotal ?? 0) > 0;

  const firstName = quote.client.firstName || quote.client.name.split(/\s+/)[0];

  return (
    <main className="flex-1" style={{ background: "var(--bg-base)" }}>
      {/* Hero */}
      <div className="bg-navy-900 py-10">
        <div className="container-store">
          <p className="text-xs font-semibold text-se-green uppercase tracking-widest mb-2">Secure Payment</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {isPaid ? "Payment Complete" : `Quotation ${quote.quoteNumber ?? quote.ref}`}
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            {isPaid
              ? "This quotation has been paid — a receipt was sent to your email."
              : `Prepared for ${quote.client.name}${quote.client.company ? ` · ${quote.client.company}` : ""}`}
          </p>
        </div>
      </div>

      <div className="container-store py-8 md:py-12">
        {/* Callback banners */}
        {cbStatus === "failed" && !isPaid && (
          <div className="max-w-3xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-xl text-sm bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/10 dark:border-red-800 dark:text-red-400" role="alert">
            Your payment was not completed. No charge was made — you can try again below.
          </div>
        )}
        {(cbStatus === "error" || cbStatus === "invalid") && !isPaid && (
          <div className="max-w-3xl mx-auto mb-6 flex items-start gap-3 p-4 rounded-xl text-sm bg-amber-50 border border-amber-200 text-amber-800 dark:bg-amber-900/10 dark:border-amber-700 dark:text-amber-300" role="alert">
            We couldn&apos;t confirm your payment yet. If you completed the checkout, this page will
            update shortly — your bank confirmation is also on its way by email.
          </div>
        )}

        {/* Guard screens */}
        {!isPaid && !isApproved && !isExpired && (
          <StatusScreen icon="lock" title="This quotation isn't ready for payment">
            <p>
              Quotation <span className="font-mono font-semibold">{quote.ref}</span> is currently{" "}
              <strong>{QUOTE_STATUS_LABELS[quote.status] ?? quote.status}</strong>. Payment becomes
              available once our sales team approves it — you&apos;ll receive an email with this link
              activated.
            </p>
            <p>
              <Link href="/contact" className="text-navy-500 font-semibold hover:underline">Contact sales</Link>
              {" "}if you believe this is an error.
            </p>
          </StatusScreen>
        )}

        {isExpired && !isPaid && (
          <StatusScreen icon="clock" title="This quotation has expired">
            <p>
              Quotation <span className="font-mono font-semibold">{quote.quoteNumber ?? quote.ref}</span>{" "}
              was valid until <strong>{fmtDate(quote.expiresAt)}</strong>. Pricing and stock are no
              longer guaranteed.
            </p>
            <p>
              <Link href="/contact" className="text-navy-500 font-semibold hover:underline">Contact our sales team</Link>
              {" "}to refresh the quotation — reference {quote.ref}.
            </p>
          </StatusScreen>
        )}

        {/* Paid receipt or payable summary */}
        {(isPaid || payable) && totals && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8 items-start max-w-5xl mx-auto">
            {/* Items */}
            <Panel>
              <header className="px-5 sm:px-6 py-4 border-b" style={{ borderColor: "var(--border)" }}>
                <h2 className="text-[15px] font-bold text-(--text-1)">Quotation Items</h2>
                <p className="text-xs text-(--text-3) mt-0.5">
                  {quote.quoteNumber ?? quote.ref} · approved {fmtDate(quote.approvedAt)}
                </p>
              </header>

              <div className="hidden sm:flex items-center px-6 py-2.5 border-b text-[11px] font-bold uppercase tracking-wider text-(--text-4)"
                style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
                <span className="flex-1">Product</span>
                <span className="w-14 text-right">Qty</span>
                <span className="w-28 text-right">Unit</span>
                <span className="w-28 text-right">Total</span>
              </div>

              <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
                {quote.items.map((item, i) => (
                  <li key={i} className="px-5 sm:px-6 py-4">
                    <div className="flex items-start gap-3 flex-wrap sm:flex-nowrap">
                      <div className="flex-1 min-w-[180px]">
                        {item.brand && (
                          <p className="text-[11px] font-bold text-navy-500 uppercase tracking-wide">{item.brand}</p>
                        )}
                        <p className="text-sm font-semibold text-(--text-1) leading-snug">{item.name || item.description}</p>
                        {item.sku && <p className="text-[11px] font-mono text-(--text-4) mt-0.5">SKU {item.sku}</p>}
                        {item.notes && <p className="text-[11px] italic text-(--text-3) mt-1">“{item.notes}”</p>}
                      </div>
                      <span className="w-14 text-right text-sm text-(--text-2) tabular-nums">×{item.quantity}</span>
                      <span className="w-28 text-right text-sm text-(--text-2) tabular-nums">
                        {item.unitPrice !== undefined ? fmt(item.unitPrice, totals.currency) : "—"}
                      </span>
                      <span className="w-28 text-right text-sm font-semibold text-(--text-1) tabular-nums">
                        {item.lineTotal !== undefined ? fmt(item.lineTotal, totals.currency)
                          : item.unitPrice !== undefined ? fmt(item.unitPrice * item.quantity, totals.currency) : "—"}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {quote.quoteNote && (
                <div className="px-5 sm:px-6 py-4 border-t text-[13px] text-(--text-3)" style={{ borderColor: "var(--border)" }}>
                  <span className="font-semibold text-(--text-2)">Note from APT Ghana: </span>
                  {quote.quoteNote}
                </div>
              )}
            </Panel>

            {/* Sticky summary / receipt */}
            <aside className="rounded-2xl border p-5 lg:sticky lg:top-24"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <h2 className="text-base font-bold text-(--text-1) mb-4">
                {isPaid ? "Receipt" : "Payment Summary"}
              </h2>

              <dl className="space-y-2.5 mb-4 text-sm">
                <div className="flex justify-between">
                  <dt className="text-(--text-3)">Subtotal</dt>
                  <dd className="font-semibold text-(--text-1) tabular-nums">{fmt(totals.subtotal, totals.currency)}</dd>
                </div>
                {totals.discount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-(--text-3)">Discount</dt>
                    <dd className="font-semibold tabular-nums text-red-600 dark:text-red-400">− {fmt(totals.discount, totals.currency)}</dd>
                  </div>
                )}
                {totals.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-(--text-3)">Tax ({totals.taxRate}%)</dt>
                    <dd className="font-semibold text-(--text-1) tabular-nums">{fmt(totals.taxAmount, totals.currency)}</dd>
                  </div>
                )}
                {totals.shipping > 0 && (
                  <div className="flex justify-between">
                    <dt className="text-(--text-3)">Shipping</dt>
                    <dd className="font-semibold text-(--text-1) tabular-nums">{fmt(totals.shipping, totals.currency)}</dd>
                  </div>
                )}
                <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <dt className="text-sm font-bold text-(--text-1)">Grand Total</dt>
                  <dd className="text-lg font-bold tabular-nums text-(--text-1)">{fmt(totals.grandTotal, totals.currency)}</dd>
                </div>
              </dl>

              {isPaid ? (
                <>
                  <div className="flex items-center gap-2.5 p-3 rounded-xl mb-4 bg-se-green-light dark:bg-green-900/20">
                    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className="text-se-green shrink-0" aria-hidden>
                      <path d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    <div className="text-[12px] leading-relaxed" style={{ color: "var(--text-2)" }}>
                      Paid{quote.payment?.paidAt ? ` on ${fmtDate(quote.payment.paidAt)}` : ""}
                      {quote.payment?.channel ? ` via ${quote.payment.channel}` : ""}
                    </div>
                  </div>
                  {quote.payment?.reference && (
                    <p className="text-[12px] text-(--text-3) mb-4">
                      Transaction ref: <span className="font-mono font-semibold text-(--text-2)">{quote.payment.reference}</span>
                    </p>
                  )}
                  <p className="text-[12px] text-(--text-3)">
                    Hi {firstName}, our fulfilment team has your order
                    {quote.status !== "paid" ? ` (currently ${QUOTE_STATUS_LABELS[quote.status]})` : ""}.
                    We&apos;ll email you at each step through delivery.
                  </p>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2.5 p-3 rounded-xl mb-4 text-[12px] leading-relaxed"
                    style={{ background: "var(--bg-raised)", color: "var(--text-3)" }}>
                    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-se-green" aria-hidden>
                      <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Valid until <strong className="text-(--text-2)">&nbsp;{fmtDate(quote.expiresAt)}</strong>
                  </div>
                  <PayButton token={token} amountLabel={fmt(totals.grandTotal, totals.currency)} />
                </>
              )}

              <a
                href={`/api/documents/token/${token}?type=${isPaid ? "receipt" : "proforma"}&download=1`}
                className="w-full flex items-center justify-center gap-2 h-10 mt-3 rounded-xl text-sm font-semibold border border-(--border) text-(--text-2) hover:border-navy-400 hover:text-navy-500 transition-colors"
              >
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                Download {isPaid ? "Receipt" : "Proforma"} PDF
              </a>

              <p className="flex items-start gap-2 text-[11px] text-(--text-4) mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-px" aria-hidden>
                  <path d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
                Questions? Call +233 302 000 000 and reference {quote.quoteNumber ?? quote.ref}.
              </p>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
