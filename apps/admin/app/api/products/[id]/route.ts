import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel, BrandModel } from "@apt/db";
import { removeProductRecord } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";
import { resolveCategoryChain, buildEmbeddedCategories } from "@/lib/catalogue";
import { syncProductToSearch } from "@/lib/productSearch";
import { slugify } from "@apt/types";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("products:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const product = await ProductModel.findById(id);
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    const cleanList = (v: unknown): string[] =>
      Array.isArray(v) ? v.map((x) => String(x).trim()).filter(Boolean) : [];

    if (body.name !== undefined)             updates.name = body.name.trim();
    if (body.slug !== undefined)             updates.slug = body.slug?.trim() || slugify(body.name ?? product.name as string);
    if (body.sku  !== undefined)             updates.sku  = body.sku.trim().toUpperCase();
    if (body.mpn  !== undefined)             updates.mpn  = body.mpn?.trim() || undefined;
    if (body.supplierRef !== undefined)      updates.supplierRef = body.supplierRef?.trim() || undefined;
    if (body.shortDescription !== undefined) updates.shortDescription = body.shortDescription?.trim();
    if (body.description !== undefined)      updates.description      = body.description?.trim();
    if (body.status !== undefined)           updates.status = body.status;
    if (body.features !== undefined)         updates.features       = cleanList(body.features);
    if (body.applications !== undefined)     updates.applications   = cleanList(body.applications);
    if (body.certifications !== undefined)   updates.certifications = cleanList(body.certifications);
    if (body.tags !== undefined)             updates.tags           = cleanList(body.tags);
    if (body.isNew !== undefined)            updates.isNew        = Boolean(body.isNew);
    if (body.isFeatured !== undefined)       updates.isFeatured   = Boolean(body.isFeatured);
    if (body.isClearance !== undefined)      updates.isClearance  = Boolean(body.isClearance);
    if (body.discount !== undefined)         updates.discount     = body.discount ? Math.min(100, Math.max(0, parseFloat(body.discount))) : 0;

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

    if (body.categoryId !== undefined) {
      if (body.categoryId) {
        const chain = await resolveCategoryChain(body.categoryId);
        if (!chain) return NextResponse.json({ error: "Selected catalogue location was not found" }, { status: 422 });
        updates.categories = buildEmbeddedCategories(chain.chain);
        updates.primaryCategoryId = chain.chain[chain.chain.length - 1]?.id;
        updates.catalogue = { path: chain.path, url: chain.url };
      } else {
        updates.categories = [];
        updates.primaryCategoryId = undefined;
        updates.catalogue = undefined;
      }
    }

    // Schema shape: specifications: [{ group, attributes: [{ name, value, unit }] }]
    if (body.specGroups !== undefined) {
      updates.specifications = (body.specGroups ?? [])
        .map((g: { name?: string; specs?: { key?: string; value?: string; unit?: string }[] }) => ({
          group: g.name?.trim() || "General",
          attributes: (g.specs ?? [])
            .filter((s) => s.key?.trim() && s.value?.trim())
            .map((s) => ({ name: s.key!.trim(), value: s.value!.trim(), unit: s.unit?.trim() || undefined })),
        }))
        .filter((g: { attributes: unknown[] }) => g.attributes.length > 0);
    }

    const numOrSkip = (path: string, raw: unknown, parse: (v: string) => number) => {
      if (raw === undefined) return;
      const n = parse(String(raw));
      if (!Number.isNaN(n)) updates[path] = n;
    };
    numOrSkip("pricing.listPrice", body.listPrice, parseFloat);
    numOrSkip("pricing.tradePrice", body.tradePrice, parseFloat);
    numOrSkip("pricing.minimumOrderQty", body.minimumOrderQty, (v) => parseInt(v, 10));
    if (body.currency !== undefined)  updates["pricing.currency"]  = body.currency || "GHS";
    if (body.leadTime !== undefined)  updates["pricing.leadTime"]  = body.leadTime?.trim() || undefined;
    if (body.incoterms !== undefined) updates["pricing.incoterms"] = body.incoterms?.trim() || undefined;

    numOrSkip("inventory.quantity", body.quantity ?? body.stockQty, (v) => parseInt(v, 10));

    if (body.metaTitle !== undefined || body.metaDescription !== undefined) {
      updates["seo.title"]       = body.metaTitle?.trim()       || body.name?.trim() || product.name as string;
      updates["seo.description"] = body.metaDescription?.trim() ?? "";
    }

    await ProductModel.updateOne({ _id: id }, { $set: updates });

    // Fire-and-forget: sync updated product to search index
    syncProductToSearch(id).catch((err) =>
      console.error("[search] index-on-update failed:", err),
    );

    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/products/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission("products:delete");
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
