import { NextRequest, NextResponse } from "next/server";
import { connectDB, OrderModel } from "@apt/db";
import {
  allowedOrderKind,
  orderToDocument,
  renderBusinessDocument,
  type OrderLike,
} from "@apt/documents";
import { requirePermission } from "@/lib/auth/require";

interface Params { params: Promise<{ id: string }> }

/** Order confirmation / invoice / receipt PDF for the sales team. */
export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requirePermission('orders:view');
  if (deny) return deny;
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    await connectDB();
    const order = await OrderModel.findById(id).lean<OrderLike>();
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = allowedOrderKind(order, req.nextUrl.searchParams.get("type"));
    if (!kind) {
      return NextResponse.json({ error: "Document not available for this order's status" }, { status: 409 });
    }

    const buffer = await renderBusinessDocument(orderToDocument(order, kind));
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${order.ref ?? "order"}-${kind}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error("[admin order pdf]", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
