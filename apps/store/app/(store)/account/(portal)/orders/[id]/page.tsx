import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { connectDB, OrderModel } from "@apt/db";
import OrderDetail, { type OrderView } from "@/components/account/OrderDetail";

export const metadata: Metadata = { title: "Order Detail" };

interface Props { params: Promise<{ id: string }> }

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) notFound();

  const session = await auth();
  await connectDB();
  const order = await OrderModel.findOne({ _id: id, userId: session!.user.id })
    .lean<{
      _id: unknown;
      ref?: string;
      status: string;
      items?: {
        productId?: unknown; sku?: string; name: string; brandSlug?: string;
        quantity: number; unitPrice: number; totalPrice: number; image?: string; notes?: string;
      }[];
      subtotal?: number; discount?: number; tax?: number; shipping?: number;
      total?: number; currency?: string;
      quoteNumber?: string; payToken?: string;
      paymentRef?: string; paymentMethod?: string;
      notes?: string; trackingNumber?: string; trackingUrl?: string;
      createdAt: Date; updatedAt: Date;
    }>();
  if (!order) notFound();

  const view: OrderView = {
    id: String(order._id),
    ref: order.ref ?? String(order._id).slice(-6).toUpperCase(),
    status: order.status,
    items: (order.items ?? []).map((i) => ({
      productId: i.productId ? String(i.productId) : null,
      sku: i.sku ?? "",
      name: i.name,
      brand: i.brandSlug ?? "",
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      totalPrice: i.totalPrice,
      image: i.image ?? "",
      notes: i.notes ?? "",
    })),
    subtotal: order.subtotal ?? 0,
    discount: order.discount ?? 0,
    tax: order.tax ?? 0,
    shipping: order.shipping ?? 0,
    total: order.total ?? 0,
    currency: order.currency ?? "GHS",
    quoteNumber: order.quoteNumber ?? "",
    payToken: order.payToken ?? "",
    paymentRef: order.paymentRef ?? "",
    paymentMethod: order.paymentMethod ?? "",
    notes: order.notes ?? "",
    trackingNumber: order.trackingNumber ?? "",
    trackingUrl: order.trackingUrl ?? "",
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Link href="/account/orders" className="text-xs font-bold text-navy-500 hover:text-navy-400 transition-colors">
          ← Back to orders
        </Link>
      </div>
      <OrderDetail order={view} />
    </div>
  );
}
