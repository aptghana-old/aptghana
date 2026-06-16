import { NextRequest, NextResponse } from "next/server";
import { connectDB, ArticleModel, recordAudit } from "@apt/db";
import { ARTICLE_STATUSES } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

const MAX_IDS = 500;

export async function POST(req: NextRequest) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;

  let body: { ids?: string[]; action?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No articles selected" }, { status: 422 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} articles at a time` }, { status: 422 });

  try {
    await connectDB();
    const session = await auth();
    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };

    if (body.action === "set_status") {
      if (!body.status || !ARTICLE_STATUSES.includes(body.status as typeof ARTICLE_STATUSES[number])) {
        return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
      }
      await ArticleModel.updateMany({ _id: { $in: ids } }, { $set: { status: body.status } });
      await Promise.all(ids.map((id) => recordAudit({ entityType: "article", entityId: id, action: "status_changed", toStatus: body.status, actor, message: "Bulk update" })));
      return NextResponse.json({ ok: true, updated: ids.length });
    }

    if (body.action === "delete") {
      const docs = await ArticleModel.find({ _id: { $in: ids } }).select("title").lean();
      await ArticleModel.deleteMany({ _id: { $in: ids } });
      await Promise.all(docs.map((a) => recordAudit({ entityType: "article", entityId: a._id, action: "article_deleted", actor, message: `Bulk-deleted "${a.title}"` })));
      return NextResponse.json({ ok: true, deleted: docs.length });
    }

    return NextResponse.json({ error: "Unknown bulk action" }, { status: 400 });
  } catch (err) {
    console.error("POST /api/articles/bulk", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
