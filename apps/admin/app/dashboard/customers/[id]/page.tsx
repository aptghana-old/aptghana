import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  connectDB, UserModel, OrderModel, QuoteModel, PaymentModel,
  TransactionModel, AuditLogModel, EmailLogModel,
} from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import {
  ChevronLeft, Mail, Phone, Building2, Globe, MapPin, Calendar, Clock,
  DollarSign, ShoppingCart, FileText, Wallet, TrendingUp, History, Mailbox,
  FileBox, CreditCard,
} from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Tabs, TabList, Tab, TabPanel } from "@/components/ui/Tabs";
import { EmptyState } from "@/components/ui/EmptyState";
import { auth } from "@/lib/auth";
import { getSalesReps } from "@/lib/customers";
import CustomerQuickActions from "@/components/customers/CustomerQuickActions";
import AssignRepSelect from "@/components/customers/AssignRepSelect";
import NotesPanel from "@/components/customers/NotesPanel";

export const metadata: Metadata = { title: "Customer" };

interface Props { params: Promise<{ id: string }> }

interface CustomerDoc {
  _id: { toString(): string };
  name: string; email: string; phone?: string; company?: string; jobTitle?: string;
  accountType: string; businessType?: string; industry?: string; website?: string; taxNumber?: string;
  tags?: string[]; status: string; emailVerified: boolean; mfaEnabled: boolean;
  assignedSalesRep?: { toString(): string }; assignedSalesRepName?: string;
  addresses?: { _id: { toString(): string }; label?: string; line1: string; line2?: string; city: string; region?: string; country?: string; postalCode?: string; isDefaultBilling?: boolean; isDefaultShipping?: boolean }[];
  paymentMethods?: { _id: { toString(): string }; type: string; brand?: string; last4?: string; momoNetwork?: string; bankName?: string; isDefault?: boolean }[];
  notes?: { _id: { toString(): string }; body: string; authorName?: string; createdAt: Date }[];
  documents?: { _id: { toString(): string }; name: string; url: string; category: string; size: number; uploadedAt: Date }[];
  createdAt: Date; lastLoginAt?: Date;
}

interface OrderRow {
  _id: { toString(): string }; ref: string; total: number; currency: string; status: string;
  items?: unknown[]; createdAt: Date; quoteId?: { toString(): string };
}
interface QuoteRow {
  _id: { toString(): string }; ref: string; quoteNumber?: string; kind: string; status: string;
  totals?: { grandTotal?: number; currency?: string }; orderRef?: string; createdAt: Date;
}
interface PaymentRow {
  _id: { toString(): string }; reference: string; quoteNumber?: string; amount: number; currency: string;
  status: string; channel?: string; paidAt?: Date; createdAt: Date;
}
interface RefundRow {
  _id: { toString(): string }; reference: string; amount: number; currency: string; status: string; paidAt?: Date; createdAt: Date;
}
interface AuditRow {
  _id: { toString(): string }; entityType: string; action: string; fromStatus?: string; toStatus?: string;
  actor?: { type?: string; name?: string }; message?: string; createdAt: Date;
}
interface EmailRow {
  _id: { toString(): string }; to: string; subject: string; template: string; status: string; createdAt: Date;
}

const ACTIVITY_LABELS: Record<string, string> = {
  customer_created: "Account created",
  customer_updated: "Profile updated",
  status_changed: "Status changed",
  note_added: "Internal note added",
  sales_rep_assigned: "Sales rep assignment changed",
  email_sent: "Email sent",
  quote_started: "Quote started",
  order_started: "Order started",
  rfq_submitted: "RFQ submitted",
  quote_approved: "Quote approved",
  payment_succeeded: "Payment received",
};

async function getData(id: string) {
  await connectDB();
  const customer = await UserModel.findById(id)
    .select("-passwordHash -mfaSecret -loginHistory")
    .lean<CustomerDoc>();
  if (!customer) return null;

  const [orders, quotes, payments, salesReps] = await Promise.all([
    OrderModel.find({ userId: id }).sort({ createdAt: -1 }).lean<OrderRow[]>(),
    QuoteModel.find({ userId: id }).sort({ createdAt: -1 }).lean<QuoteRow[]>(),
    PaymentModel.find({ email: customer.email }).sort({ createdAt: -1 }).lean<PaymentRow[]>(),
    getSalesReps(),
  ]);

  const quoteIds = quotes.map((q) => q._id);
  const [refunds, audit, emails] = await Promise.all([
    TransactionModel.find({ quoteId: { $in: quoteIds }, type: "refund" }).sort({ createdAt: -1 }).lean<RefundRow[]>(),
    AuditLogModel.find({ $or: [{ entityType: "user", entityId: id }, { entityType: "quote", entityId: { $in: quoteIds } }] })
      .sort({ createdAt: -1 }).limit(100).lean<AuditRow[]>(),
    EmailLogModel.find({ userId: id }).sort({ createdAt: -1 }).limit(50).lean<EmailRow[]>(),
  ]);

  return { customer, orders, quotes, payments, refunds, audit, emails, salesReps };
}

const UNSETTLED_ORDER_STATUSES = ["pending", "confirmed", "processing"];

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  const { customer, orders, quotes, payments, refunds, audit, emails, salesReps } = data;

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "customers:edit");
  const canExport = hasPermission(role, overrides, "exports:run");
  const canNotes = hasPermission(role, overrides, "customers:notes");

  const ltv = orders.reduce((sum, o) => sum + (o.total ?? 0), 0);
  const outstandingBalance = orders
    .filter((o) => UNSETTLED_ORDER_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + (o.total ?? 0), 0);
  const avgOrderValue = orders.length > 0 ? ltv / orders.length : 0;
  const totalOrdersCount = orders.length;
  const totalQuotesCount = quotes.filter((q) => q.kind === "approval_request").length;
  const totalRfqsCount = quotes.filter((q) => q.kind !== "approval_request").length;
  const currency = orders[0]?.currency ?? "GHS";

  const billing = customer.addresses?.find((a) => a.isDefaultBilling);
  const shipping = customer.addresses?.find((a) => a.isDefaultShipping);

  const kpis = [
    { label: "Lifetime Revenue", value: `${currency} ${ltv.toLocaleString()}`, icon: <DollarSign size={15} /> },
    { label: "Total Orders", value: totalOrdersCount.toLocaleString(), icon: <ShoppingCart size={15} /> },
    { label: "Total Quotes", value: totalQuotesCount.toLocaleString(), icon: <FileText size={15} /> },
    { label: "Total RFQs", value: totalRfqsCount.toLocaleString(), icon: <FileText size={15} /> },
    { label: "Outstanding Balance", value: `${currency} ${outstandingBalance.toLocaleString()}`, icon: <Wallet size={15} /> },
    { label: "Avg. Order Value", value: `${currency} ${avgOrderValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, icon: <TrendingUp size={15} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Link href="/dashboard/customers">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Customers</Button>
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap mt-3">
          <div className="flex items-center gap-3.5">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-[16px] font-bold text-white shrink-0"
              style={{ background: "#1e4278" }}
            >
              {customer.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[18px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{customer.name}</h1>
                <Badge variant={statusVariant(customer.status)} dot>{customer.status}</Badge>
                <Badge variant={customer.accountType === "business" ? "blue" : "default"}>
                  {customer.accountType === "business" ? "Business" : "Individual"}
                </Badge>
                {customer.tags?.map((t) => <Badge key={t} variant="default">{t}</Badge>)}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[12px] flex-wrap" style={{ color: "var(--apt-text-muted)" }}>
                <span className="font-mono">ID {customer._id.toString().slice(-8).toUpperCase()}</span>
                <span className="flex items-center gap-1"><Calendar size={11} />Joined {new Date(customer.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short", year: "numeric" })}</span>
                {customer.lastLoginAt && (
                  <span className="flex items-center gap-1"><Clock size={11} />Last active {new Date(customer.lastLoginAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {canEdit && (
              <AssignRepSelect customerId={customer._id.toString()} current={customer.assignedSalesRep?.toString()} reps={salesReps} />
            )}
            <CustomerQuickActions
              customer={{ id: customer._id.toString(), name: customer.name, email: customer.email, status: customer.status }}
              canEdit={canEdit}
              canExport={canExport}
              variant="buttons"
            />
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:p-6 pb-0">
        {kpis.map((k) => (
          <div key={k.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span style={{ color: "var(--apt-text-muted)" }}>{k.icon}</span>
            </div>
            <p className="text-[15px] font-semibold tabular-nums truncate" style={{ color: "var(--apt-text-primary)" }}>{k.value}</p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{k.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="p-4 sm:p-6">
        <Tabs defaultValue="overview">
          <TabList className="mb-5 overflow-x-auto">
            <Tab value="overview">Overview</Tab>
            <Tab value="orders">Orders ({totalOrdersCount})</Tab>
            <Tab value="quotations">Quotations ({totalQuotesCount + totalRfqsCount})</Tab>
            <Tab value="payments">Payments ({payments.length})</Tab>
            <Tab value="addresses">Addresses ({customer.addresses?.length ?? 0})</Tab>
            <Tab value="documents">Documents ({customer.documents?.length ?? 0})</Tab>
            <Tab value="activity">Activity</Tab>
            <Tab value="notes">Notes ({customer.notes?.length ?? 0})</Tab>
            <Tab value="communication">Communication ({emails.length})</Tab>
          </TabList>

          {/* Overview */}
          <TabPanel value="overview">
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <div className="card p-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Contact Information</p>
                <InfoRow icon={<Mail size={14} />} label={customer.email} href={`mailto:${customer.email}`} />
                {customer.phone && <InfoRow icon={<Phone size={14} />} label={customer.phone} href={`tel:${customer.phone}`} />}
                {customer.website && <InfoRow icon={<Globe size={14} />} label={customer.website} href={customer.website} external />}
              </div>

              <div className="card p-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Business Information</p>
                {customer.company ? <InfoRow icon={<Building2 size={14} />} label={customer.company} /> : <EmptyHint text="No company on file" />}
                {customer.jobTitle && <InfoRow icon={<Building2 size={14} />} label={customer.jobTitle} />}
                {customer.industry && <InfoRow icon={<Building2 size={14} />} label={`Industry: ${customer.industry}`} />}
                {customer.businessType && <InfoRow icon={<Building2 size={14} />} label={`Type: ${customer.businessType.replace(/-/g, " ")}`} />}
                {customer.taxNumber && <InfoRow icon={<FileText size={14} />} label={`Tax/VAT: ${customer.taxNumber}`} />}
              </div>

              <div className="card p-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Billing Address</p>
                {billing ? <AddressBlock a={billing} /> : <EmptyHint text="No billing address on file" />}
              </div>

              <div className="card p-5 space-y-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>Shipping Address</p>
                {shipping ? <AddressBlock a={shipping} /> : <EmptyHint text="No shipping address on file" />}
              </div>
            </div>
          </TabPanel>

          {/* Orders */}
          <TabPanel value="orders">
            {orders.length === 0 ? (
              <div className="card"><EmptyState icon={<ShoppingCart size={20} />} title="No orders yet" /></div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Order</th><th>Status</th><th className="text-right">Total</th><th>Date</th><th /></tr></thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id.toString()}>
                          <td><Link href={`/dashboard/orders/${o._id.toString()}`} className="font-mono text-[12px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>{o.ref}</Link></td>
                          <td><Badge variant={statusVariant(o.status)} dot>{o.status.replace(/_/g, " ")}</Badge></td>
                          <td className="text-right tabular-nums text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{o.currency} {o.total.toLocaleString()}</td>
                          <td className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(o.createdAt).toLocaleDateString("en-GH")}</td>
                          <td>
                            <a href={`/api/orders/${o._id.toString()}/pdf`} target="_blank" rel="noopener noreferrer" className="text-[12px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>Invoice PDF</a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabPanel>

          {/* Quotations (Quotes + RFQs) */}
          <TabPanel value="quotations">
            {quotes.length === 0 ? (
              <div className="card"><EmptyState icon={<FileText size={20} />} title="No quotes or RFQs yet" /></div>
            ) : (
              <div className="card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead><tr><th>Reference</th><th>Type</th><th>Status</th><th className="text-right">Total</th><th>Converted</th><th>Date</th></tr></thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q._id.toString()}>
                          <td><Link href={`/dashboard/quotes/${q._id.toString()}`} className="font-mono text-[12px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>{q.quoteNumber ?? q.ref}</Link></td>
                          <td><Badge variant={q.kind === "approval_request" ? "blue" : "default"}>{q.kind === "approval_request" ? "Approval Request" : "RFQ"}</Badge></td>
                          <td><Badge variant={statusVariant(q.status)} dot>{q.status.replace(/_/g, " ")}</Badge></td>
                          <td className="text-right tabular-nums text-[13px]" style={{ color: "var(--apt-text-primary)" }}>
                            {q.totals?.grandTotal ? `${q.totals.currency ?? "GHS"} ${q.totals.grandTotal.toLocaleString()}` : "—"}
                          </td>
                          <td className="text-[12px]" style={{ color: q.orderRef ? "#15803d" : "var(--apt-text-muted)" }}>{q.orderRef ?? "Not converted"}</td>
                          <td className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(q.createdAt).toLocaleDateString("en-GH")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </TabPanel>

          {/* Payments */}
          <TabPanel value="payments">
            <div className="space-y-5">
              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--apt-text-secondary)" }}>Payment History</p>
                {payments.length === 0 ? (
                  <div className="card"><EmptyState icon={<CreditCard size={20} />} title="No payments recorded" /></div>
                ) : (
                  <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="data-table">
                        <thead><tr><th>Reference</th><th>Quote</th><th className="text-right">Amount</th><th>Status</th><th>Channel</th><th>Date</th></tr></thead>
                        <tbody>
                          {payments.map((p) => (
                            <tr key={p._id.toString()}>
                              <td className="font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{p.reference}</td>
                              <td className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{p.quoteNumber ?? "—"}</td>
                              <td className="text-right tabular-nums text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{p.currency} {p.amount.toLocaleString()}</td>
                              <td><Badge variant={statusVariant(p.status)} dot>{p.status}</Badge></td>
                              <td className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{(p.channel ?? "—").replace(/_/g, " ")}</td>
                              <td className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(p.paidAt ?? p.createdAt).toLocaleDateString("en-GH")}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--apt-text-secondary)" }}>Outstanding Orders</p>
                {orders.filter((o) => UNSETTLED_ORDER_STATUSES.includes(o.status)).length === 0 ? (
                  <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No outstanding balances.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {orders.filter((o) => UNSETTLED_ORDER_STATUSES.includes(o.status)).map((o) => (
                      <li key={o._id.toString()} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--apt-bg-raised)" }}>
                        <span className="font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{o.ref}</span>
                        <span className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{o.currency} {o.total.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div>
                <p className="text-[12px] font-semibold mb-2" style={{ color: "var(--apt-text-secondary)" }}>Credit Notes & Refunds</p>
                {refunds.length === 0 ? (
                  <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No refunds issued.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {refunds.map((r) => (
                      <li key={r._id.toString()} className="flex items-center justify-between px-3 py-2 rounded-md" style={{ background: "var(--apt-bg-raised)" }}>
                        <span className="font-mono text-[12px]" style={{ color: "var(--apt-text-secondary)" }}>{r.reference}</span>
                        <span className="text-[13px] font-semibold" style={{ color: "#dc2626" }}>-{r.currency} {r.amount.toLocaleString()}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </TabPanel>

          {/* Addresses */}
          <TabPanel value="addresses">
            {!customer.addresses || customer.addresses.length === 0 ? (
              <div className="card"><EmptyState icon={<MapPin size={20} />} title="No addresses on file" /></div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {customer.addresses.map((a) => (
                  <div key={a._id.toString()} className="card p-4">
                    <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                      <p className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{a.label ?? "Address"}</p>
                      {a.isDefaultBilling && <Badge variant="blue">Default Billing</Badge>}
                      {a.isDefaultShipping && <Badge variant="success">Default Shipping</Badge>}
                    </div>
                    <AddressBlock a={a} />
                  </div>
                ))}
              </div>
            )}
          </TabPanel>

          {/* Documents */}
          <TabPanel value="documents">
            {!customer.documents || customer.documents.length === 0 ? (
              <div className="card"><EmptyState icon={<FileBox size={20} />} title="No documents uploaded" description="Contracts, certificates, and tax documents appear here once uploaded." /></div>
            ) : (
              <div className="card overflow-hidden">
                <ul className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
                  {customer.documents.map((d) => (
                    <li key={d._id.toString()} className="flex items-center justify-between px-4 py-3">
                      <a href={d.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2.5 text-[13px] hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                        <FileBox size={14} />{d.name}
                      </a>
                      <div className="flex items-center gap-3">
                        <Badge variant="default">{d.category}</Badge>
                        <span className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{new Date(d.uploadedAt).toLocaleDateString("en-GH")}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </TabPanel>

          {/* Activity Timeline */}
          <TabPanel value="activity">
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
                <History size={12} /> Activity Timeline
              </p>
              {audit.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No activity recorded yet.</p>
              ) : (
                <ol className="space-y-3.5">
                  {audit.map((entry) => (
                    <li key={entry._id.toString()} className="flex gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: "var(--apt-text-brand)" }} />
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                          {ACTIVITY_LABELS[entry.action] ?? entry.action.replace(/_/g, " ")}
                          {entry.fromStatus && entry.toStatus && entry.fromStatus !== entry.toStatus && (
                            <span style={{ color: "var(--apt-text-muted)" }}> · {entry.fromStatus} → {entry.toStatus}</span>
                          )}
                        </p>
                        {entry.message && <p className="text-[11.5px] mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>{entry.message}</p>}
                        <p className="text-[11px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
                          {entry.actor?.name ?? entry.actor?.type ?? "system"} · {new Date(entry.createdAt).toLocaleString("en-GH")}
                        </p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </TabPanel>

          {/* Notes */}
          <TabPanel value="notes">
            <NotesPanel
              customerId={customer._id.toString()}
              canAdd={canNotes}
              initialNotes={(customer.notes ?? []).slice().reverse().map((n) => ({
                _id: n._id.toString(),
                body: n.body,
                authorName: n.authorName,
                createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt),
              }))}
            />
          </TabPanel>

          {/* Communication */}
          <TabPanel value="communication">
            <div className="card p-5">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
                <Mailbox size={12} /> Email History
              </p>
              {emails.length === 0 ? (
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No emails sent to this customer yet.</p>
              ) : (
                <ul className="divide-y" style={{ borderColor: "var(--apt-border)" }}>
                  {emails.map((e) => (
                    <li key={e._id.toString()} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate" style={{ color: "var(--apt-text-primary)" }}>{e.subject}</p>
                        <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{e.template.replace(/-/g, " ")} · {new Date(e.createdAt).toLocaleString("en-GH")}</p>
                      </div>
                      <Badge variant={e.status === "sent" ? "success" : e.status === "failed" ? "error" : "pending"}>{e.status}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </TabPanel>
        </Tabs>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, href, external }: { icon: React.ReactNode; label: string; href?: string; external?: boolean }) {
  const content = (
    <div className="flex items-center gap-2.5">
      <span style={{ color: "var(--apt-text-muted)" }}>{icon}</span>
      <span className="text-[13px]" style={{ color: href ? "var(--apt-text-brand)" : "var(--apt-text-secondary)" }}>{label}</span>
    </div>
  );
  if (!href) return content;
  return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} className="hover:underline">{content}</a>;
}

function EmptyHint({ text }: { text: string }) {
  return <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>{text}</p>;
}

function AddressBlock({ a }: { a: { line1: string; line2?: string; city: string; region?: string; country?: string; postalCode?: string } }) {
  return (
    <div className="flex items-start gap-2.5">
      <MapPin size={14} className="shrink-0 mt-0.5" style={{ color: "var(--apt-text-muted)" }} />
      <p className="text-[13px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>
        {a.line1}{a.line2 ? `, ${a.line2}` : ""}<br />
        {[a.city, a.region, a.postalCode].filter(Boolean).join(", ")}<br />
        {a.country}
      </p>
    </div>
  );
}
