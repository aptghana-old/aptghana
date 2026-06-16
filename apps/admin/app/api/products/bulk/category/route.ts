import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { resolveCategoryChain, buildEmbeddedCategories } from "@/lib/catalogue";
import { syncProductToSearch } from "@/lib/productSearch";

const MAX_IDS = 500;

/** Bulk-move products to a new Group/Category/Subcategory/Range for large catalogue restructuring. */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("products:edit");
  if (deny) return deny;

  let body: { ids?: string[]; categoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const ids = Array.isArray(body.ids) ? body.ids.filter(Boolean) : [];
  if (ids.length === 0) return NextResponse.json({ error: "No products selected" }, { status: 422 });
  if (ids.length > MAX_IDS) return NextResponse.json({ error: `Select at most ${MAX_IDS} products at a time` }, { status: 422 });
  if (!body.categoryId) return NextResponse.json({ error: "A catalogue location is required" }, { status: 422 });

  try {
    const session = await auth();
    await connectDB();

    const chain = await resolveCategoryChain(body.categoryId);
    if (!chain) return NextResponse.json({ error: "Selected catalogue location was not found" }, { status: 422 });

    const categories = buildEmbeddedCategories(chain.chain);
    const primaryCategoryId = chain.chain[chain.chain.length - 1]?.id;

    await ProductModel.updateMany(
      { _id: { $in: ids } },
      { $set: { categories, primaryCategoryId, catalogue: { path: chain.path, url: chain.url } } }
    );

    const actor = { type: "sales" as const, id: session?.user?.id, name: session?.user?.name ?? "Admin" };
    await Promise.all(
      ids.map((entityId) =>
        Promise.all([
          syncProductToSearch(entityId).catch((err) => console.error("[search] bulk move sync failed:", entityId, err)),
          recordAudit({ entityType: "product", entityId, action: "catalogue_moved", actor, message: `Bulk-moved to ${chain.path}` }),
        ])
      )
    );

    return NextResponse.json({ ok: true, moved: ids.length, path: chain.path });
  } catch (err) {
    console.error("POST /api/products/bulk/category", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
