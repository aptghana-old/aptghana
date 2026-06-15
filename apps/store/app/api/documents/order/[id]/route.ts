import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, OrderModel } from "@apt/db";
import type { OrderLike } from "@apt/documents";
import { allowedOrderKind, orderPdf } from "@/lib/documents/serve";

interface Params { params: Promise<{ id: string }> }

/** Order confirmation / invoice / receipt PDF for the order's owner. */
export async function GET(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!/^[a-f0-9]{24}$/i.test(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const order = await OrderModel.findOne({ _id: id, userId: session.user.id }).lean<OrderLike>();
    if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const kind = allowedOrderKind(order, req.nextUrl.searchParams.get("type"));
    if (!kind) {
      return NextResponse.json({ error: "Document not available for this order's status" }, { status: 409 });
    }

    return await orderPdf(order, kind, req.nextUrl.searchParams.get("download") === "1");
  } catch (err) {
    console.error("[documents order]", err);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
