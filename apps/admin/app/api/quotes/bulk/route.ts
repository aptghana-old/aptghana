import { NextRequest, NextResponse } from "next/server";
import { connectDB, QuoteModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

// Bulk actions are intentionally limited to safe, side-effect-free transitions —
// approval/payment have dedicated workflows (audit, email, order creation) and
// are never reachable through this endpoint.
const VALID_STATUSES = ["cancelled", "expired"];
const MAX_IDS = 500;

export async function POST(req: NextRequest) {
  const deny = await requirePermission("quotes:edit");
  if (deny) return deny;

  let body: { ids?: string[]; action?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No quotes selected" }, { status: 422 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} quotes at a time` }, { status: 422 });
  if (body.action !== "set_status") return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const session = await auth();
    await QuoteModel.updateMany({ _id: { $in: ids } }, { $set: { status: body.status } });

    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };
    await Promise.all(ids.map((id) => recordAudit({ entityType: "quote", entityId: id, action: "status_changed", toStatus: body.status, actor, message: "Bulk update" })));

    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (err) {
    console.error("POST /api/quotes/bulk", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
