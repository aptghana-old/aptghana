import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { assertDeletable } from "@/lib/categoryHierarchy";

const VALID_STATUSES = ["active", "inactive"];
const MAX_IDS = 500;

export async function POST(req: NextRequest) {
  const deny = await requirePermission("categories:edit");
  if (deny) return deny;

  let body: { ids?: string[]; action?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No categories selected" }, { status: 422 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} categories at a time` }, { status: 422 });

  try {
    await connectDB();
    const session = await auth();
    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };

    if (body.action === "set_status") {
      if (!body.status || !VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
      }
      await CategoryModel.updateMany({ _id: { $in: ids } }, { $set: { status: body.status } });
      await Promise.all(ids.map((id) => recordAudit({ entityType: "category", entityId: id, action: "status_changed", toStatus: body.status, actor })));
      return NextResponse.json({ ok: true, updated: ids.length });
    }

    if (body.action === "delete") {
      const deny2 = await requirePermission("categories:delete");
      if (deny2) return deny2;

      const results = await Promise.all(ids.map(async (id) => ({ id, check: await assertDeletable(id) })));
      const blocked = results.filter((r) => !r.check.deletable);
      const deletable = results.filter((r) => r.check.deletable).map((r) => r.id);

      if (deletable.length > 0) {
        const names = await CategoryModel.find({ _id: { $in: deletable } }).select("name").lean();
        await CategoryModel.deleteMany({ _id: { $in: deletable } });
        await Promise.all(names.map((c) => recordAudit({ entityType: "category", entityId: c._id, action: "category_deleted", actor, message: `Bulk-deleted "${c.name}"` })));
      }

      return NextResponse.json({
        ok: true,
        deleted: deletable.length,
        skipped: blocked.map((b) => ({ id: b.id, reason: b.check.reason })),
      });
    }

    return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/categories/bulk", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
