import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { connectDB, OrderModel } from "@apt/db";
import { PageHeader, StatusBadge, EmptyState } from "@/components/account/ui";

export const metadata: Metadata = { title: "My Orders" };
export const revalidate = 60;

interface OrderDoc {
  _id: string;
  ref?: string;
  status: string;
  total?: number;
  currency?: string;
  items?: unknown[];
  payToken?: string;
  quoteNumber?: string;
  createdAt: Date;
}

async function getOrders(userId: string): Promise<OrderDoc[]> {
  await connectDB();
  const orders = await OrderModel
    .find({ userId })
    .select("ref status total currency items payToken quoteNumber createdAt")
    .sort({ createdAt: -1 })
    .limit(50)
    .lean<OrderDoc[]>()
    .catch(() => []);
  return orders;
}

/** Order workflow labels — "pending" means approved & awaiting payment. */
const ORDER_LABELS: Record<string, string> = {
  pending: "Awaiting Payment",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

function fmt(date: Date) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" }).format(new Date(date));
}

function fmtCurrency(amount = 0, currency = "GHS") {
  return new Intl.NumberFormat("en-GH", { style: "currency", currency }).format(amount);
}

export default async function OrdersPage() {
  const session = await auth();
  const orders = await getOrders(session!.user.id);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Orders"
        subtitle={orders.length ? `${orders.length} order${orders.length === 1 ? "" : "s"} found.` : undefined}
        action={
          <Link href="/rfq" className="inline-flex items-center gap-1.5 h-9 px-4 bg-se-green hover:bg-se-green-hover text-white text-xs font-bold rounded-xl transition-colors">
            Request a Quote
          </Link>
        }
      />

      {orders.length === 0 ? (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl">
          <EmptyState
            icon="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            title="No orders yet"
            description="When you place orders, they will appear here for tracking and reordering."
            action={
              <Link href="/products" className="inline-flex items-center gap-1.5 h-10 px-5 bg-navy-500 hover:bg-navy-400 text-white text-sm font-bold rounded-xl transition-colors">
                Browse Products
              </Link>
            }
          />
        </div>
      ) : (
        <div className="bg-(--bg-surface) border border-(--border) rounded-2xl overflow-hidden">
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-(--border) bg-(--bg-raised)">
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-6 py-3.5">Order</th>
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-4 py-3.5">Date</th>
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-4 py-3.5">Items</th>
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-4 py-3.5">Total</th>
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-4 py-3.5">Status</th>
                  <th className="text-left text-xs font-bold text-(--text-4) uppercase tracking-wide px-6 py-3.5">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id.toString()} className="border-b border-(--border) last:border-0 hover:bg-(--bg-raised) transition-colors">
                    <td className="px-6 py-4 font-semibold text-(--text-1) font-mono text-[13px]">
                      {order.ref ?? String(order._id).slice(-6).toUpperCase()}
                    </td>
                    <td className="px-4 py-4 text-(--text-3)">{fmt(order.createdAt)}</td>
                    <td className="px-4 py-4 text-(--text-3)">{order.items?.length ?? "—"}</td>
                    <td className="px-4 py-4 font-semibold text-(--text-1)">{fmtCurrency(order.total, order.currency)}</td>
                    <td className="px-4 py-4"><StatusBadge status={order.status} label={ORDER_LABELS[order.status]} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {order.status === "pending" && order.payToken && (
                          <Link
                            href={`/pay/${order.payToken}`}
                            className="inline-flex items-center h-7 px-3 rounded-lg text-[11px] font-bold text-white bg-se-green hover:bg-se-green-hover transition-colors"
                          >
                            Pay now
                          </Link>
                        )}
                        <Link
                          href={`/account/orders/${order._id}`}
                          className="text-xs font-bold text-navy-500 hover:text-navy-400 transition-colors"
                        >
                          View →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-(--border)">
            {orders.map((order) => (
              <Link
                key={order._id.toString()}
                href={`/account/orders/${order._id}`}
                className="flex items-center justify-between px-4 py-4 hover:bg-(--bg-raised) transition-colors"
              >
                <div>
                  <p className="font-semibold text-(--text-1) text-sm font-mono">{order.ref ?? String(order._id).slice(-6).toUpperCase()}</p>
                  <p className="text-xs text-(--text-4) mt-0.5">{fmt(order.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <StatusBadge status={order.status} label={ORDER_LABELS[order.status]} />
                  <p className="text-xs font-bold text-(--text-1)">
                    {order.status === "pending" && order.payToken ? "Pay now → " : ""}
                    {fmtCurrency(order.total, order.currency)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
