import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, AdminModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { customerBulkActionSchema, parseBody } from "@apt/types";

/** Bulk customer actions from the list view: status change, sales rep assignment, tagging. */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const parsed = parseBody(customerBulkActionSchema, raw);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
  const body = parsed.data;
  const ids = body.ids;

  try {
    const session = await auth();
    await connectDB();
    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };

    switch (body.action) {
      case "set_status": {
        if (!body.status) {
          return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
        }
        await UserModel.updateMany({ _id: { $in: ids } }, { $set: { status: body.status } });
        await Promise.all(
          ids.map((entityId) =>
            recordAudit({ entityType: "user", entityId, action: "status_changed", toStatus: body.status, actor })
          )
        );
        return NextResponse.json({ ok: true, updated: ids.length });
      }

      case "assign_rep": {
        let rep: { _id: unknown; name: string } | null = null;
        if (body.salesRepId) {
          rep = await AdminModel.findById(body.salesRepId).select("name").lean<{ _id: unknown; name: string }>();
          if (!rep) return NextResponse.json({ error: "Sales rep not found" }, { status: 404 });
        }
        await UserModel.updateMany(
          { _id: { $in: ids } },
          { $set: { assignedSalesRep: rep?._id ?? undefined, assignedSalesRepName: rep?.name ?? undefined } }
        );
        await Promise.all(
          ids.map((entityId) =>
            recordAudit({
              entityType: "user", entityId, action: "sales_rep_assigned", actor,
              message: rep ? `Bulk-assigned to ${rep.name}` : "Bulk-unassigned",
            })
          )
        );
        return NextResponse.json({ ok: true, updated: ids.length });
      }

      case "add_tag": {
        const tag = body.tag?.trim();
        if (!tag) return NextResponse.json({ error: "A tag is required" }, { status: 422 });
        await UserModel.updateMany({ _id: { $in: ids } }, { $addToSet: { tags: tag } });
        return NextResponse.json({ ok: true, updated: ids.length });
      }

      default:
        return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
    }
  } catch (err) {
    console.error("POST /api/customers/bulk", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
