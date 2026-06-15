import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel, BrandModel, CategoryModel } from "@apt/db";
import {
  buildProductRecord,
  upsertProductRecord,
  removeProductRecord,
  extractCategoryIds,
  type CategoryForIndex,
  type ProductForIndex,
} from "@apt/search";
import { requireAdmin } from "@/lib/auth/require";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

async function syncToSearch(id: string): Promise<void> {
  type ProductRow = ProductForIndex & {
    brandId?: { toString(): string };
    status?: string;
    categories?: unknown[];
  };
  const product = await ProductModel.findById(id).lean() as unknown as ProductRow | null;
  if (!product) return;

  if (product.status !== "active") {
    await removeProductRecord(id);
    return;
  }

  const brandName = product.brandId
    ? ((await BrandModel.findById(product.brandId).select("name").lean()) as { name?: string } | null)?.name ?? ""
    : "";

  const catIds = extractCategoryIds(product.categories ?? []);
  type CatRow = { _id: unknown; name: string; slug: string; level?: string };
  const cats: CatRow[] = catIds.length
    ? await CategoryModel.find({ _id: { $in: catIds } }).select("_id name slug level").lean() as unknown as CatRow[]
    : [];

  const indexCats: CategoryForIndex[] = cats.map((c) => ({
    _id:   c._id,
    name:  c.name,
    slug:  c.slug,
    level: c.level as CategoryForIndex["level"],
  }));

  const record = buildProductRecord(product, brandName, indexCats);
  await upsertProductRecord(record);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const product = await ProductModel.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.name !== undefined)             updates.name = body.name.trim();
    if (body.slug !== undefined)             updates.slug = body.slug?.trim() || slugify(body.name ?? product.name as string);
    if (body.sku  !== undefined)             updates.sku  = body.sku.trim().toUpperCase();
    if (body.mpn  !== undefined)             updates.mpn  = body.mpn?.trim() || undefined;
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription?.trim();
    if (body.description !== undefined)      updates.description      = body.description?.trim();
    if (body.status !== undefined)           updates.status = body.status;

    if (body.brandId !== undefined) {
      if (body.brandId) {
        const brand = await BrandModel.findById(body.brandId).select("name slug").lean() as { name: string; slug: string } | null;
        if (brand) {
          updates.brandId   = body.brandId;
          updates.brandName = brand.name;
          updates.brandSlug = brand.slug;
        }
      } else {
        updates.brandId   = undefined;
        updates.brandName = undefined;
        updates.brandSlug = undefined;
      }
    }

    if (body.categoryIds !== undefined) {
      type CatRow = { _id: { toString(): string }; name: string; slug: string };
      const cats = await CategoryModel.find({ _id: { $in: body.categoryIds } }).select("name slug").lean() as unknown as CatRow[];
      updates.categories = cats.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug }));
    }

    if (body.specGroups !== undefined) {
      updates.specifications = (body.specGroups ?? [])
        .map((g: { name: string; specs: { key: string; value: string }[] }) => ({
          groupName: g.name,
          specs: g.specs.filter((s) => s.key && s.value).map((s) => ({ name: s.key, values: [s.value] })),
        }))
        .filter((g: { specs: unknown[] }) => g.specs.length > 0);
    }

    if (body.listPrice !== undefined || body.currency !== undefined) {
      updates["pricing.listPrice"] = body.listPrice ? parseFloat(body.listPrice) : undefined;
      updates["pricing.currency"]  = body.currency ?? "GHS";
    }

    if (body.stockQty !== undefined) {
      updates["inventory.stockQty"] = parseInt(body.stockQty, 10);
    }

    if (body.metaTitle !== undefined || body.metaDescription !== undefined) {
      updates["seo.metaTitle"]       = body.metaTitle?.trim()       || body.name?.trim() || product.name as string;
      updates["seo.metaDescription"] = body.metaDescription?.trim();
    }

    await ProductModel.updateOne({ _id: id }, { $set: updates });

    // Fire-and-forget: sync updated product to search index
    syncToSearch(id).catch((err) =>
      console.error("[search] index-on-update failed:", err),
    );

    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/products/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    await ProductModel.updateOne({ _id: id }, { $set: { status: "archived" } });

    // Remove from search index (archived = no longer searchable)
    removeProductRecord(id).catch((err) =>
      console.error("[search] remove-on-delete failed:", err),
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/products/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
