import { NextRequest, NextResponse } from "next/server";
import { connectDB, OrderModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

const VALID_STATUSES = ["confirmed", "processing", "shipped", "delivered", "cancelled"];
const MAX_IDS = 500;

export async function POST(req: NextRequest) {
  const deny = await requirePermission("orders:edit");
  if (deny) return deny;

  let body: { ids?: string[]; action?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No orders selected" }, { status: 422 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} orders at a time` }, { status: 422 });
  if (body.action !== "set_status") return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const session = await auth();
    await OrderModel.updateMany({ _id: { $in: ids } }, { $set: { status: body.status } });

    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };
    await Promise.all(ids.map((id) => recordAudit({ entityType: "order", entityId: id, action: "status_changed", toStatus: body.status, actor, message: "Bulk order update" })));

    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (err) {
    console.error("POST /api/orders/bulk", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
