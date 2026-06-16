import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

/** Bulk-updates displayOrder for a set of sibling categories after a drag-and-drop reorder. */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("categories:edit");
  if (deny) return deny;

  let body: { orderedIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.orderedIds) ? body.orderedIds.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "orderedIds is required" }, { status: 422 });

  try {
    await connectDB();
    await Promise.all(
      ids.map((id, index) => CategoryModel.updateOne({ _id: id }, { $set: { displayOrder: index } }))
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/categories/reorder", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
