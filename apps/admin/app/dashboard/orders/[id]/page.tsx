import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { connectDB, OrderModel } from "@apt/db";
import { ChevronLeft, Package, User, MapPin, CreditCard, Clock, FileDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Order" };

type BadgeVariant = "default" | "active" | "inactive" | "pending" | "draft" | "success" | "warning" | "error" | "info" | "blue";
const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: "pending",
  confirmed: "info",
  processing: "warning",
  shipped: "blue",
  delivered: "success",
  cancelled: "error",
  refunded: "error",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

interface OrderData {
  _id: { toString(): string };
  ref: string;
  status: string;
  items: { productId?: string; name: string; sku: string; quantity: number; unitPrice: number; totalPrice: number; brandSlug?: string }[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  currency: string;
  guest?: { name?: string; email?: string; phone?: string };
  shippingAddress?: { line1?: string; city?: string; region?: string; country?: string };
  paymentMethod?: string;
  paymentRef?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

async function getOrder(id: string) {
  await connectDB();
  const order = await OrderModel.findById(id).lean();
  return order as unknown as OrderData | null;
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrder(id);
  if (!order) notFound();

  const fmt = (n: number) => `${order.currency} ${n.toLocaleString("en-GH", { minimumFractionDigits: 2 })}`;

  return (
    <div>
      <div
        className="flex items-center gap-4 px-6 py-4"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link href="/dashboard/orders">
          <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />}>Orders</Button>
        </Link>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <h1 className="text-[15px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
          Order #{order.ref}
        </h1>
        <Badge variant={STATUS_VARIANT[order.status] ?? "default"} dot className="ml-2">
          {STATUS_LABEL[order.status] ?? order.status}
        </Badge>

        {/* Document downloads */}
        <div className="ml-auto flex items-center gap-1.5">
          {[
            { type: "invoice", label: "Invoice PDF", show: true },
            { type: "receipt", label: "Receipt PDF", show: Boolean(order.paymentRef) },
          ].filter((d) => d.show).map((d) => (
            <a
              key={d.type}
              href={`/api/orders/${order._id.toString()}/pdf?type=${d.type}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md text-[12px] font-medium transition-colors hover:bg-[var(--apt-bg-raised)]"
              style={{ border: "1px solid var(--apt-border)", color: "var(--apt-text-secondary)" }}
            >
              <FileDown size={12} />
              {d.label}
            </a>
          ))}
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-5">
        {/* Left: line items + timeline */}
        <div className="col-span-2 space-y-5">
          <div className="card overflow-hidden">
            <div className="card-header flex items-center gap-2">
              <Package size={15} style={{ color: "var(--apt-text-muted)" }} />
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>
                Order Items ({order.items.length})
              </h2>
            </div>
            {order.items.length === 0 ? (
              <div className="px-5 py-6 text-center">
                <p className="text-[13px]" style={{ color: "var(--apt-text-muted)" }}>No items</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((item, i) => (
                    <tr key={i}>
                      <td className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{item.name}</td>
                      <td><span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{item.sku}</span></td>
                      <td className="text-right text-[13px]" style={{ color: "var(--apt-text-primary)" }}>{item.quantity}</td>
                      <td className="text-right text-[13px]" style={{ color: "var(--apt-text-primary)" }}>{fmt(item.unitPrice)}</td>
                      <td className="text-right text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>{fmt(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="px-5 py-4" style={{ borderTop: "1px solid var(--apt-border)" }}>
              <div className="max-w-xs ml-auto space-y-1.5">
                <div className="flex justify-between text-[12px]">
                  <span style={{ color: "var(--apt-text-muted)" }}>Subtotal</span>
                  <span style={{ color: "var(--apt-text-primary)" }}>{fmt(order.subtotal)}</span>
                </div>
                {order.shipping > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: "var(--apt-text-muted)" }}>Shipping</span>
                    <span style={{ color: "var(--apt-text-primary)" }}>{fmt(order.shipping)}</span>
                  </div>
                )}
                {order.tax > 0 && (
                  <div className="flex justify-between text-[12px]">
                    <span style={{ color: "var(--apt-text-muted)" }}>Tax</span>
                    <span style={{ color: "var(--apt-text-primary)" }}>{fmt(order.tax)}</span>
                  </div>
                )}
                <div
                  className="flex justify-between pt-2 text-[14px] font-semibold"
                  style={{ borderTop: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                >
                  <span>Total</span>
                  <span>{fmt(order.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={15} style={{ color: "var(--apt-text-muted)" }} />
              <h2 className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Timeline</h2>
            </div>
            <div className="text-[12px] space-y-3">
              {[
                { label: STATUS_LABEL[order.status] ?? order.status, time: new Date(order.updatedAt).toLocaleString("en-GH"), current: true },
                { label: "Order created", time: new Date(order.createdAt).toLocaleString("en-GH"), current: false },
              ].map((ev, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-2 h-2 rounded-full mt-0.5 shrink-0"
                    style={{ background: ev.current ? "#0057b8" : "var(--apt-border)" }}
                  />
                  <div>
                    <div className="font-medium" style={{ color: "var(--apt-text-primary)" }}>{ev.label}</div>
                    <div style={{ color: "var(--apt-text-muted)" }}>{ev.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Customer */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <User size={14} style={{ color: "var(--apt-text-muted)" }} />
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Customer</h3>
            </div>
            {order.guest ? (
              <div className="space-y-1 text-[12px]">
                {order.guest.name && <div className="font-medium" style={{ color: "var(--apt-text-primary)" }}>{order.guest.name}</div>}
                {order.guest.email && <div style={{ color: "var(--apt-text-secondary)" }}>{order.guest.email}</div>}
                {order.guest.phone && <div style={{ color: "var(--apt-text-muted)" }}>{order.guest.phone}</div>}
              </div>
            ) : (
              <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>Guest / not specified</p>
            )}
          </div>

          {/* Shipping address */}
          {order.shippingAddress && (
            <div className="card p-5">
              <div className="flex items-center gap-2 mb-3">
                <MapPin size={14} style={{ color: "var(--apt-text-muted)" }} />
                <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Shipping Address</h3>
              </div>
              <div className="text-[12px] space-y-0.5" style={{ color: "var(--apt-text-secondary)" }}>
                {order.shippingAddress.line1 && <div>{order.shippingAddress.line1}</div>}
                <div>{[order.shippingAddress.city, order.shippingAddress.region, order.shippingAddress.country].filter(Boolean).join(", ")}</div>
              </div>
            </div>
          )}

          {/* Payment */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard size={14} style={{ color: "var(--apt-text-muted)" }} />
              <h3 className="text-[13px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Payment</h3>
            </div>
            <dl className="space-y-1.5 text-[12px]">
              <div className="flex justify-between">
                <dt style={{ color: "var(--apt-text-muted)" }}>Method</dt>
                <dd style={{ color: "var(--apt-text-primary)" }}>{order.paymentMethod ?? "—"}</dd>
              </div>
              {order.paymentRef && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Ref</dt>
                  <dd className="font-mono" style={{ color: "var(--apt-text-primary)" }}>{order.paymentRef}</dd>
                </div>
              )}
              {order.trackingNumber && (
                <div className="flex justify-between">
                  <dt style={{ color: "var(--apt-text-muted)" }}>Tracking</dt>
                  <dd className="font-mono" style={{ color: "var(--apt-text-primary)" }}>{order.trackingNumber}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Actions */}
          <div className="card p-5 space-y-2">
            <Button variant="secondary" size="sm" className="w-full justify-center">Update Status</Button>
            <Button variant="ghost" size="sm" className="w-full justify-center" style={{ color: "#b91c1c" }}>Cancel Order</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
