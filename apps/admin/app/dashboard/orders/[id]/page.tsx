import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, OrderModel, AuditLogModel, UserModel, Types } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import {
  ChevronLeft, Package, User, MapPin, CreditCard, Clock, FileDown,
  ClipboardCheck, CheckCircle2, Settings2, Truck, Check,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { auth } from "@/lib/auth";
import { StatusStepper, StatusBanner, type StepperStep } from "@/components/deals/StatusStepper";
import UpdateStatusMenu from "@/components/deals/UpdateStatusMenu";

export const metadata: Metadata = { title: "Order" };

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_DOT: Record<string, string> = {
  pending: "#D97706", confirmed: "#0284C7", processing: "#5B6CFF",
  shipped: "#0BA5A5", delivered: "#12B76A", cancelled: "#E4573D", refunded: "#E4573D",
};

const STEPS = [
  { key: "pending", label: "Order Placed", icon: <ClipboardCheck size={17} /> },
  { key: "confirmed", label: "Confirmed", icon: <CheckCircle2 size={17} /> },
  { key: "processing", label: "Processing", icon: <Settings2 size={17} /> },
  { key: "shipped", label: "Shipped", icon: <Truck size={17} /> },
  { key: "delivered", label: "Delivered", icon: <Check size={17} /> },
];

const AUDIT_ACTION_LABELS: Record<string, string> = {
  status_changed: "Status changed",
  payment_succeeded: "Payment received",
  payment_failed: "Payment failed",
};

interface OrderData {
  _id: Types.ObjectId;
  ref: string;
  status: string;
  items: { productId?: { toString(): string }; name: string; sku: string; quantity: number; unitPrice: number; totalPrice: number }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  userId?: Types.ObjectId;
  quoteId?: { toString(): string };
  guest?: { name?: string; email?: string; phone?: string };
  shippingAddress?: { line1?: string; city?: string; region?: string; country?: string };
  paymentStatus?: string;
  paymentMethod?: string;
  paymentRef?: string;
  originChannel?: string;
  trackingNumber?: string;
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

interface CustomerDoc { _id: { toString(): string }; name?: string; email?: string; phone?: string; company?: string; assignedSalesRepName?: string }

async function getData(id: string) {
  await connectDB();
  const [order, audit] = await Promise.all([
    OrderModel.findById(id).lean().catch(() => null) as Promise<OrderData | null>,
    AuditLogModel.find({ entityType: "order", entityId: id }).sort({ createdAt: -1 }).limit(30).lean<AuditDoc[]>().catch(() => [] as AuditDoc[]),
  ]);
  const customer = order?.userId
    ? ((await UserModel.findById(order.userId).select("name email phone company assignedSalesRepName").lean().catch(() => null)) as CustomerDoc | null)
    : null;
  return { order, audit, customer };
}

const fmtTime = (d: Date) =>
  new Date(d).toLocaleString("en-GH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!Types.ObjectId.isValid(id)) notFound();
  const { order, audit, customer } = await getData(id);
  if (!order) notFound();

  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "orders:edit");

  const fmt = (n: number) => `${order.currency ?? "GHS"} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const isTerminal = order.status === "cancelled" || order.status === "refunded";
  const curStep = STEPS.findIndex((s) => s.key === order.status);
  const steps: StepperStep[] = STEPS.map((s, i) => ({
    ...s,
    done: curStep >= 0 && i <= curStep,
    active: i === curStep,
  }));

  const customerName = order.guest?.name ?? customer?.name;
  const customerEmail = order.guest?.email ?? customer?.email;
  const customerPhone = order.guest?.phone ?? customer?.phone;

  /* Timeline: real audit events + creation; payment row only when actually paid. */
  const timeline: { label: string; desc?: string; time?: string; dot: string }[] = [
    ...audit.map((a) => ({
      label: AUDIT_ACTION_LABELS[a.action] ?? a.action.replace(/_/g, " "),
      desc: [
        a.fromStatus && a.toStatus && a.fromStatus !== a.toStatus ? `${STATUS_LABEL[a.fromStatus] ?? a.fromStatus} → ${STATUS_LABEL[a.toStatus] ?? a.toStatus}` : a.toStatus ? `→ ${STATUS_LABEL[a.toStatus] ?? a.toStatus}` : null,
        a.actor?.name ?? a.actor?.type,
      ].filter(Boolean).join(" · ") || undefined,
      time: fmtTime(a.createdAt),
      dot: a.toStatus ? STATUS_DOT[a.toStatus] ?? "#94A3B8" : "#94A3B8",
    })),
    ...(order.paymentStatus === "paid"
      ? [{ label: "Payment confirmed", desc: `${order.paymentMethod ?? "Paystack"} · ${fmt(order.total)}`, dot: "#12B76A" }]
      : []),
    {
      label: "Order created",
      desc: order.originChannel ? `via ${order.originChannel} channel` : order.quoteId ? "converted from quote" : undefined,
      time: fmtTime(order.createdAt),
      dot: "#94A3B8",
    },
  ];

  return (
    <div>
      {/* ── Back bar ── */}
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-4 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Orders</Button>
        </Link>
        <h1 className="font-mono text-[19px] font-extrabold tracking-tight" style={{ color: "var(--apt-text-primary)" }}>
          {order.ref}
        </h1>
        <Badge variant={statusVariant(order.status)} dot>{STATUS_LABEL[order.status] ?? order.status}</Badge>

        <div className="ml-auto flex items-center gap-2 flex-wrap">
          {[
            { type: "invoice", label: "Invoice PDF", show: true },
            { type: "receipt", label: "Receipt PDF", show: Boolean(order.paymentRef) },
          ].filter((d) => d.show).map((d) => (
            <a
              key={d.type}
              href={`/api/orders/${order._id.toString()}/pdf?type=${d.type}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-semibold transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
            >
              <FileDown size={12} />
              {d.label}
            </a>
          ))}
          {canEdit && (
            <UpdateStatusMenu
              endpoint="/api/orders/bulk"
              ids={[order._id.toString()]}
              current={order.status}
              options={[
                { value: "confirmed", label: "Confirmed" },
                { value: "processing", label: "Processing" },
                { value: "shipped", label: "Shipped" },
                { value: "delivered", label: "Delivered" },
                { value: "cancelled", label: "Cancelled" },
              ]}
            />
          )}
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-[1400px] space-y-4">
        {/* ── Stepper / terminal banner ── */}
        {isTerminal ? (
          <StatusBanner
            title={order.status === "refunded" ? "Order Refunded" : "Order Cancelled"}
            description={order.status === "refunded"
              ? "This order was cancelled and the payment refunded."
              : "This order was cancelled and will not be fulfilled."}
          />
        ) : (
          <StatusStepper steps={steps} />
        )}

        {/* ── 2-col band ── */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4 items-start">
          {/* Left: items + timeline */}
          <div className="space-y-4 min-w-0">
            <div className="card overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
                <Package size={15} style={{ color: "var(--apt-text-muted)" }} />
                <h2 className="text-[14px] font-bold" style={{ color: "var(--apt-text-primary)" }}>
                  Order Items ({order.items.length})
                </h2>
              </div>
              {order.items.length === 0 ? (
                <p className="px-5 py-6 text-[13px] text-center" style={{ color: "var(--apt-text-muted)" }}>No items on this order.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Qty</th>
                        <th className="text-right">Unit</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, i) => (
                        <tr key={i}>
                          <td>
                            {item.productId ? (
                              <Link href={`/dashboard/products/${item.productId.toString()}`} className="text-[12.5px] font-semibold hover:underline" style={{ color: "var(--apt-text-primary)" }}>
                                {item.name}
                              </Link>
                            ) : (
                              <div className="text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{item.name}</div>
                            )}
                            <div className="font-mono text-[10.5px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{item.sku}</div>
                          </td>
                          <td className="text-right font-mono text-[12.5px]" style={{ color: "var(--apt-text-primary)" }}>{item.quantity}</td>
                          <td className="text-right font-mono text-[12.5px]" style={{ color: "var(--apt-text-secondary)" }}>{item.unitPrice.toLocaleString("en-GH")}</td>
                          <td className="text-right font-mono text-[12.5px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{item.totalPrice.toLocaleString("en-GH")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="px-5 py-4" style={{ borderTop: "1px solid var(--apt-border)" }}>
                <div className="max-w-[280px] ml-auto space-y-2">
                  <div className="flex justify-between text-[12.5px]">
                    <span style={{ color: "var(--apt-text-muted)" }}>Subtotal</span>
                    <span className="font-mono" style={{ color: "var(--apt-text-primary)" }}>{fmt(order.subtotal)}</span>
                  </div>
                  {order.shipping > 0 && (
                    <div className="flex justify-between text-[12.5px]">
                      <span style={{ color: "var(--apt-text-muted)" }}>Shipping</span>
                      <span className="font-mono" style={{ color: "var(--apt-text-primary)" }}>{fmt(order.shipping)}</span>
                    </div>
                  )}
                  {order.tax > 0 && (
                    <div className="flex justify-between text-[12.5px]">
                      <span style={{ color: "var(--apt-text-muted)" }}>Tax</span>
                      <span className="font-mono" style={{ color: "var(--apt-text-primary)" }}>{fmt(order.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2.5 text-[15px] font-extrabold" style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}>
                    <span>Total</span>
                    <span className="font-mono">{fmt(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Clock size={15} style={{ color: "var(--apt-text-muted)" }} />
                <h2 className="text-[14px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Timeline</h2>
              </div>
              <div className="space-y-4">
                {timeline.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span
                      className="w-[11px] h-[11px] rounded-full shrink-0 mt-[3px]"
                      style={{ background: ev.dot, border: "2px solid var(--apt-bg)", boxShadow: `0 0 0 2px ${ev.dot}` }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{ev.label}</div>
                      {ev.desc && <div className="text-[11.5px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>{ev.desc}</div>}
                    </div>
                    {ev.time && (
                      <span className="font-mono text-[11px] shrink-0" style={{ color: "var(--apt-text-disabled)" }}>{ev.time}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <div className="space-y-4 min-w-0">
            {/* Customer */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <User size={15} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Customer</h3>
              </div>
              {customerName || customerEmail ? (
                <>
                  {customerName && <div className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>{customerName}</div>}
                  {customer?.company && <div className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>{customer.company}</div>}
                  {customerEmail && (
                    <a href={`mailto:${customerEmail}`} className="block text-[12px] mt-1 hover:underline" style={{ color: "var(--apt-text-brand)" }}>{customerEmail}</a>
                  )}
                  {customerPhone && <div className="text-[12px] mt-1" style={{ color: "var(--apt-text-secondary)" }}>{customerPhone}</div>}
                  {customer?.assignedSalesRepName && (
                    <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid var(--apt-border)" }}>
                      <span
                        className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[9px] font-extrabold shrink-0"
                        style={{ background: "var(--apt-bg-raised)", color: "var(--apt-text-secondary)" }}
                      >
                        {customer.assignedSalesRepName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                      </span>
                      <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Managed by {customer.assignedSalesRepName}</span>
                    </div>
                  )}
                  {customer && (
                    <Link href={`/dashboard/customers/${customer._id.toString()}`} className="block text-[11.5px] mt-2.5 hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                      View customer profile →
                    </Link>
                  )}
                </>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Guest checkout — no customer details recorded.</p>
              )}
            </div>

            {/* Shipping address */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <MapPin size={15} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Shipping Address</h3>
              </div>
              {order.shippingAddress?.line1 || order.shippingAddress?.city ? (
                <div className="text-[12.5px] leading-relaxed" style={{ color: "var(--apt-text-secondary)" }}>
                  {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
                  <div>{[order.shippingAddress.city, order.shippingAddress.region, order.shippingAddress.country].filter(Boolean).join(", ")}</div>
                </div>
              ) : (
                <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No shipping address recorded.</p>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between text-[12px] mt-3 pt-3" style={{ borderTop: "1px solid var(--apt-border)" }}>
                  <span style={{ color: "var(--apt-text-muted)" }}>Tracking</span>
                  <span className="font-mono font-semibold" style={{ color: "var(--apt-text-primary)" }}>{order.trackingNumber}</span>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3.5">
                <CreditCard size={15} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-bold" style={{ color: "var(--apt-text-primary)" }}>Payment</h3>
              </div>
              <dl className="space-y-2.5 text-[12.5px]">
                <div className="flex justify-between items-center">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Status</dt>
                  <dd>
                    {order.paymentStatus ? (
                      <Badge variant={statusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                    ) : (
                      <span style={{ color: "var(--apt-text-disabled)" }}>—</span>
                    )}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Method</dt>
                  <dd className="font-semibold" style={{ color: "var(--apt-text-primary)" }}>{order.paymentMethod ?? "—"}</dd>
                </div>
                {order.paymentRef && (
                  <div className="flex justify-between gap-3">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Ref</dt>
                    <dd className="font-mono font-semibold truncate" style={{ color: "var(--apt-text-primary)" }}>{order.paymentRef}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Channel</dt>
                  <dd className="font-semibold capitalize" style={{ color: "var(--apt-text-primary)" }}>{order.originChannel ?? "—"}</dd>
                </div>
                {order.quoteId && (
                  <div className="flex justify-between">
                    <dt style={{ color: "var(--apt-text-muted)" }}>Origin</dt>
                    <dd>
                      <Link href={`/dashboard/quotes/${order.quoteId.toString()}`} className="font-mono font-semibold hover:underline" style={{ color: "var(--apt-text-brand)" }}>
                        View quote →
                      </Link>
                    </dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
