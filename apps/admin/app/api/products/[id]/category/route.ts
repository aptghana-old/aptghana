import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { resolveCategoryChain, buildEmbeddedCategories } from "@/lib/catalogue";
import { syncProductToSearch } from "@/lib/productSearch";

interface Params { params: Promise<{ id: string }> }

/** Move a single product to a new Group/Category/Subcategory/Range. */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("products:edit");
  if (deny) return deny;

  const { id } = await params;
  let body: { categoryId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  if (!body.categoryId) {
    return NextResponse.json({ error: "A catalogue location is required" }, { status: 422 });
  }

  try {
    const session = await auth();
    await connectDB();

    const product = await ProductModel.findById(id).select("name catalogue").lean<{ name: string; catalogue?: { path?: string } }>();
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const chain = await resolveCategoryChain(body.categoryId);
    if (!chain) return NextResponse.json({ error: "Selected catalogue location was not found" }, { status: 422 });

    await ProductModel.updateOne({ _id: id }, {
      $set: {
        categories: buildEmbeddedCategories(chain.chain),
        primaryCategoryId: chain.chain[chain.chain.length - 1]?.id,
        catalogue: { path: chain.path, url: chain.url },
      },
    });

    await syncProductToSearch(id);

    await recordAudit({
      entityType: "product",
      entityId: id,
      action: "catalogue_moved",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Moved from ${product.catalogue?.path ?? "unassigned"} to ${chain.path}`,
    });

    return NextResponse.json({ ok: true, path: chain.path, url: chain.url });
  } catch (err) {
    console.error("POST /api/products/[id]/category", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
