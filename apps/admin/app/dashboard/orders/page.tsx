import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, OrderModel } from "@apt/db";
import { ShoppingCart, Clock, ArrowRight } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { PageHeader } from "@/components/ui/PageHeader";
import ExportMenu from "@/components/exports/ExportMenu";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Orders" };
export const revalidate = 30;

const ORDER_STATUSES = [
  "draft", "pending_payment", "payment_processing", "paid", "confirmed",
  "processing", "ready_for_pickup", "shipped", "delivered", "completed",
  "cancelled", "refunded",
];

interface Props {
  searchParams: Promise<{ status?: string; page?: string }>;
}

async function getOrders(status?: string, page = 1) {
  try {
    await connectDB();
    const query: Record<string, unknown> = {};
    if (status) query.status = status;
    const [orders, total] = await Promise.all([
      OrderModel.find(query).sort({ createdAt: -1 }).skip((page - 1) * 40).limit(40).lean(),
      OrderModel.countDocuments(query),
    ]);
    return { orders, total };
  } catch {
    return { orders: [], total: 0 };
  }
}

async function getStatusCounts() {
  try {
    await connectDB();
    const agg = await OrderModel.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    return Object.fromEntries(agg.map((a) => [a._id, a.count]));
  } catch {
    return {} as Record<string, number>;
  }
}

export default async function OrdersPage({ searchParams }: Props) {
  const { status, page: pageStr } = await searchParams;
  const page = Math.max(1, parseInt(pageStr ?? "1", 10));
  const [{ orders, total }, counts] = await Promise.all([getOrders(status, page), getStatusCounts()]);

  const grandTotal = (Object.values(counts) as number[]).reduce((a, b) => a + b, 0);

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${total.toLocaleString()} order${total !== 1 ? "s" : ""}`}
        actions={
          <ExportMenu datasets={[{ key: "orders", label: "Orders" }, { key: "sales", label: "Sales" }, { key: "payments", label: "Payments" }]} />
        }
      />

      {/* Status filter tabs */}
      <div
        className="flex items-center gap-1 px-4 sm:px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Link
          href="/dashboard/orders"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
          style={{
            background: !status ? "var(--apt-bg-raised)" : "transparent",
            color: !status ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
          }}
        >
          All <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--apt-border)", color: "var(--apt-text-muted)" }}>{grandTotal}</span>
        </Link>
        {["pending_payment", "paid", "processing", "shipped", "completed", "cancelled"].map((s) => (
          <Link
            key={s}
            href={`/dashboard/orders?status=${s}`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap capitalize transition-colors"
            style={{
              background: status === s ? "var(--apt-bg-raised)" : "transparent",
              color: status === s ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
            }}
          >
            {s.replace(/_/g, " ")}
            {counts[s] ? (
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "var(--apt-border)", color: "var(--apt-text-muted)" }}>
                {counts[s]}
              </span>
            ) : null}
          </Link>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {orders.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<ShoppingCart size={22} />}
              title="No orders yet"
              description="Orders placed on the store will appear here with their full lifecycle."
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th className="hidden sm:table-cell">Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="hidden md:table-cell">Payment</th>
                  <th className="hidden md:table-cell">Date</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const order = o as unknown as {
                    _id: { toString(): string };
                    ref: string;
                    customer?: { name: string; email?: string };
                    items?: unknown[];
                    total?: number;
                    currency?: string;
                    status: string;
                    paymentStatus?: string;
                    createdAt: Date;
                  };
                  return (
                    <tr key={order._id.toString()}>
                      <td>
                        <Link
                          href={`/dashboard/orders/${order._id.toString()}`}
                          className="font-mono text-[12px] hover:underline"
                          style={{ color: "var(--apt-text-brand)" }}
                        >
                          {order.ref ?? order._id.toString().slice(-8).toUpperCase()}
                        </Link>
                      </td>
                      <td>
                        <div className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                          {order.customer?.name ?? "Guest"}
                        </div>
                        {order.customer?.email && (
                          <div className="text-[11px] hidden sm:block" style={{ color: "var(--apt-text-muted)" }}>{order.customer.email}</div>
                        )}
                      </td>
                      <td className="hidden sm:table-cell">
                        <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          {(order.items?.length ?? 0)} item{(order.items?.length ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td>
                        {order.total ? (
                          <span className="text-[13px] font-semibold tabular-nums" style={{ color: "var(--apt-text-primary)" }}>
                            {order.currency ?? "GHS"} {order.total.toLocaleString()}
                          </span>
                        ) : <span style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                      </td>
                      <td><Badge variant={statusVariant(order.status)} dot>{order.status.replace(/_/g, " ")}</Badge></td>
                      <td className="hidden md:table-cell">
                        {order.paymentStatus ? (
                          <Badge variant={statusVariant(order.paymentStatus)}>{order.paymentStatus}</Badge>
                        ) : <span className="text-[12px]" style={{ color: "var(--apt-text-disabled)" }}>—</span>}
                      </td>
                      <td className="hidden md:table-cell">
                        <span className="flex items-center gap-1 text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
                          <Clock size={11} />
                          {new Date(order.createdAt).toLocaleDateString("en-GH", { day: "numeric", month: "short" })}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/dashboard/orders/${order._id.toString()}`}
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
            </div>{/* /overflow-x-auto */}
          </div>
        )}
      </div>
    </div>
  );
}
