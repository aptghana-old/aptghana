import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, QuoteModel, AuditLogModel } from "@apt/db";
import { STORE_URL as STORE_URL_DEFAULT } from "@apt/config";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";
import {
  ChevronLeft, User, Building, Mail, Phone, MapPin, Globe, History, FileDown,
  FileText, SearchCheck, CheckCircle2, CreditCard, PackageCheck,
} from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import QuoteEditor, { type EditorQuote } from "@/components/quotes/QuoteEditor";
import { StatusStepper, StatusBanner, type StepperStep } from "@/components/deals/StatusStepper";

const QUOTE_STEPS = [
  { key: "submitted", label: "Submitted", icon: <FileText size={17} /> },
  { key: "reviewing", label: "Reviewing", icon: <SearchCheck size={17} /> },
  { key: "approved", label: "Approved", icon: <CheckCircle2 size={17} /> },
  { key: "paid", label: "Paid", icon: <CreditCard size={17} /> },
  { key: "completed", label: "Completed", icon: <PackageCheck size={17} /> },
];

/** Where each quote status sits on the condensed 5-step lifecycle. */
const QUOTE_STEP_INDEX: Record<string, number> = {
  draft: 0, pending: 0,
  reviewing: 1,
  approved: 2, waiting_customer: 2,
  paid: 3, processing: 3, ready_for_delivery: 3, shipped: 3,
  delivered: 4, completed: 4,
};

export const metadata: Metadata = { title: "Quote Review" };

interface Props { params: Promise<{ id: string }> }

interface QuoteDoc {
  _id: { toString(): string };
  ref: string;
  quoteNumber?: string;
  kind?: string;
  source?: string;
  orderRef?: string;
  attachments?: { name: string; url: string; size: number; contentType: string }[];
  client: {
    name: string; firstName?: string; lastName?: string;
    email?: string; phone?: string; company?: string; country?: string; address?: string;
  };
  items: {
    productId?: { toString(): string };
    sku?: string; name?: string; brand?: string; image?: string;
    description: string; quantity: number; unitPrice?: number; lineTotal?: number; notes?: string;
  }[];
  status: QuoteStatus;
  paymentStatus?: string;
  totals?: {
    subtotal: number; discount: number; taxRate: number;
    taxAmount: number; shipping: number; grandTotal: number; currency: string;
  };
  pricingLocked?: boolean;
  payToken?: string;
  note?: string;
  internalNote?: string;
  quoteNote?: string;
  expiresAt?: Date;
  approvedAt?: Date;
  payment?: { reference?: string; channel?: string; paidAt?: Date; amount?: number };
  createdAt: Date;
  updatedAt: Date;
}

interface AuditDoc {
  _id: { toString(): string };
  action: string;
  fromStatus?: string;
  toStatus?: string;
  actor?: { type?: string; name?: string };
  message?: string;
  createdAt: Date;
}

async function getData(id: string) {
  try {
    await connectDB();
    const [quote, audit] = await Promise.all([
      QuoteModel.findById(id).lean<QuoteDoc>(),
      AuditLogModel.find({ entityType: "quote", entityId: id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean<AuditDoc[]>(),
    ]);
    return { quote, audit };
  } catch {
    return { quote: null, audit: [] as AuditDoc[] };
  }
}

const ACTION_LABELS: Record<string, string> = {
  rfq_submitted: "RFQ submitted",
  quote_edited: "Quote edited",
  quote_approved: "Quote approved",
  status_changed: "Status changed",
  payment_initialized: "Payment initialized",
  payment_succeeded: "Payment received",
  payment_failed: "Payment failed",
};

export default async function QuoteDetailPage({ params }: Props) {
  const { id } = await params;
  const { quote, audit } = await getData(id);
  if (!quote) notFound();

  const storeUrl = (process.env.STORE_URL ?? STORE_URL_DEFAULT).replace(/\/$/, "");

  const editorQuote: EditorQuote = {
    id: quote._id.toString(),
    ref: quote.ref,
    quoteNumber: quote.quoteNumber,
    status: quote.status,
    paymentStatus: quote.paymentStatus ?? "none",
    pricingLocked: Boolean(quote.pricingLocked),
    payUrl: quote.payToken ? `${storeUrl}/pay/${quote.payToken}` : null,
    items: quote.items.map((i, idx) => ({
      key: `${idx}-${i.sku ?? i.description}`,
      productId: i.productId?.toString(),
      sku: i.sku,
      name: i.name || i.description,
      brand: i.brand,
      image: i.image,
      quantity: i.quantity,
      unitPrice: i.unitPrice ?? null,
      notes: i.notes ?? "",
    })),
    totals: quote.totals ?? null,
    quoteNote: quote.quoteNote ?? "",
    internalNote: quote.internalNote ?? "",
    expiresAt: quote.expiresAt ? quote.expiresAt.toISOString() : null,
    payment: quote.payment?.reference
      ? {
          reference: quote.payment.reference,
          channel: quote.payment.channel,
          paidAt: quote.payment.paidAt ? quote.payment.paidAt.toISOString() : undefined,
          amount: quote.payment.amount,
        }
      : null,
  };

  const statusLabel = QUOTE_STATUS_LABELS[quote.status] ?? quote.status;

  const isTerminal = quote.status === "cancelled" || quote.status === "expired";
  const curStep = QUOTE_STEP_INDEX[quote.status] ?? -1;
  const steps: StepperStep[] = QUOTE_STEPS.map((s, i) => ({
    ...s,
    done: curStep >= 0 && i <= curStep,
    active: i === curStep,
  }));

  return (
    <div>
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/quotes">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Quotes</Button>
        </Link>
        <h1 className="font-mono text-[19px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
          {quote.quoteNumber ?? quote.ref}
        </h1>
        <Badge variant={statusVariant(quote.status)} dot>{statusLabel}</Badge>
        <Badge variant={quote.kind === "approval_request" ? "blue" : "default"}>
          {quote.kind === "approval_request" ? "Approval Request" : "RFQ"}
        </Badge>
        {quote.quoteNumber && (
          <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            from {quote.ref}
          </span>
        )}
        {quote.orderRef && (
          <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-brand)" }}>
            → {quote.orderRef}
          </span>
        )}

        {/* Document downloads */}
        <div className="ml-auto flex items-center gap-1.5">
          {[
            { type: "quote", label: "Request PDF", show: true },
            { type: "proforma", label: "Proforma PDF", show: Boolean(quote.quoteNumber) },
            { type: "receipt", label: "Receipt PDF", show: quote.paymentStatus === "paid" },
          ].filter((d) => d.show).map((d) => (
            <a
              key={d.type}
              href={`/api/quotes/${quote._id.toString()}/pdf?type=${d.type}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
            >
              <FileDown size={12} />
              {d.label}
            </a>
          ))}
        </div>
      </div>

      {/* Lifecycle stepper / terminal banner */}
      <div className="px-4 sm:px-6 pt-4 sm:pt-6 max-w-[1400px]">
        {isTerminal ? (
          <StatusBanner
            tone={quote.status === "expired" ? "warning" : "error"}
            title={quote.status === "expired" ? "Quote Expired" : "Quote Cancelled"}
            description={quote.status === "expired"
              ? "The validity window on this quote has passed. Re-issue it to continue the deal."
              : "This enquiry was cancelled and is no longer active."}
          />
        ) : (
          <StatusStepper steps={steps} />
        )}
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 max-w-[1400px]">
        {/* Left: editor (items, pricing, approval) */}
        <div className="xl:col-span-2 min-w-0">
          <QuoteEditor quote={editorQuote} />
        </div>

        {/* Right: customer, request context, audit trail */}
        <div className="space-y-5 min-w-0">
          <div className="card p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>Customer</p>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5">
                <User size={14} style={{ color: "var(--apt-text-muted)" }} />
                <span className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{quote.client.name}</span>
              </div>
              {quote.client.company && (
                <div className="flex items-center gap-2.5">
                  <Building size={14} style={{ color: "var(--apt-text-muted)" }} />
                  <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{quote.client.company}</span>
                </div>
              )}
              {quote.client.email && (
                <div className="flex items-center gap-2.5">
                  <Mail size={14} style={{ color: "var(--apt-text-muted)" }} />
                  <a href={`mailto:${quote.client.email}`} className="text-[13px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                    {quote.client.email}
                  </a>
                </div>
              )}
              {quote.client.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={14} style={{ color: "var(--apt-text-muted)" }} />
                  <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{quote.client.phone}</span>
                </div>
              )}
              {quote.client.country && (
                <div className="flex items-center gap-2.5">
                  <Globe size={14} style={{ color: "var(--apt-text-muted)" }} />
                  <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{quote.client.country}</span>
                </div>
              )}
              {quote.client.address && (
                <div className="flex items-center gap-2.5">
                  <MapPin size={14} style={{ color: "var(--apt-text-muted)" }} />
                  <span className="text-[13px]" style={{ color: "var(--apt-text-secondary)" }}>{quote.client.address}</span>
                </div>
              )}
            </div>
          </div>

          {quote.note && (
            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: "var(--apt-text-muted)" }}>Customer Message</p>
              <p className="text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>{quote.note}</p>
            </div>
          )}

          {/* Supporting documents */}
          {(quote.attachments?.length ?? 0) > 0 && (
            <div className="card p-5">
              <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
                Supporting Documents ({quote.attachments!.length})
              </p>
              <ul className="space-y-2">
                {quote.attachments!.map((a, i) => (
                  <li key={i}>
                    <a
                      href={`${storeUrl}${a.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] transition-colors hover:bg-[var(--apt-bg-raised)]"
                      style={{ color: "var(--apt-text-brand)", border: "1px solid var(--apt-border)" }}
                    >
                      <span className="flex-1 min-w-0 truncate font-medium">{a.name}</span>
                      <span className="text-[11px] shrink-0" style={{ color: "var(--apt-text-muted)" }}>
                        {a.size < 1048576 ? `${(a.size / 1024).toFixed(0)} KB` : `${(a.size / 1048576).toFixed(1)} MB`}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Audit trail */}
          <div className="card p-5">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
              <History size={12} /> Audit Trail
            </p>
            {audit.length === 0 ? (
              <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No workflow events recorded yet.</p>
            ) : (
              <ol className="space-y-3">
                {audit.map((entry) => (
                  <li key={entry._id.toString()} className="flex gap-2.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                      style={{ background: "var(--apt-text-brand)" }}
                    />
                    <div className="min-w-0">
                      <p className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                        {ACTION_LABELS[entry.action] ?? entry.action}
                        {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus && (
                          <span style={{ color: "var(--apt-text-muted)" }}>
                            {" "}· {QUOTE_STATUS_LABELS[entry.fromStatus as QuoteStatus] ?? entry.fromStatus} → {QUOTE_STATUS_LABELS[entry.toStatus as QuoteStatus] ?? entry.toStatus}
                          </span>
                        )}
                      </p>
                      {entry.message && (
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>{entry.message}</p>
                      )}
                      <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                        {entry.actor?.name ?? entry.actor?.type ?? "system"} · {new Date(entry.createdAt).toLocaleString("en-GH")}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
