import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel, BrandModel, CategoryModel } from "@apt/db";
import { buildProductRecord, upsertProductRecord, type CategoryForIndex } from "@apt/search";
import { requireAdmin } from "@/lib/auth/require";

function slugify(text: string) {
  return text.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const { name, sku, mpn, slug, brandId, categoryIds, shortDescription, description, status,
      specGroups, listPrice, currency, stockQty, metaTitle, metaDescription } = body;

    if (!name?.trim() || !sku?.trim()) {
      return NextResponse.json({ error: "Name and SKU are required" }, { status: 422 });
    }

    const existing = await ProductModel.findOne({ sku: sku.toUpperCase() });
    if (existing) {
      return NextResponse.json({ error: `SKU "${sku}" already exists` }, { status: 409 });
    }

    let brandName: string | undefined;
    let brandSlug: string | undefined;
    if (brandId) {
      const brand = await BrandModel.findById(brandId).select("name slug").lean() as { name: string; slug: string } | null;
      if (brand) { brandName = brand.name; brandSlug = brand.slug; }
    }

    type CatRow = { _id: { toString(): string }; name: string; slug: string; level?: string };
    const catRows: CatRow[] = categoryIds?.length
      ? await CategoryModel.find({ _id: { $in: categoryIds } }).select("name slug level").lean() as unknown as CatRow[]
      : [];

    const categories = catRows.map((c) => ({ id: c._id.toString(), name: c.name, slug: c.slug }));

    const specs = (specGroups ?? []).map((g: { name: string; specs: { key: string; value: string }[] }) => ({
      groupName: g.name,
      specs: g.specs.filter((s) => s.key && s.value).map((s) => ({ name: s.key, values: [s.value] })),
    })).filter((g: { specs: unknown[] }) => g.specs.length > 0);

    const finalSlug = slug?.trim() || slugify(name);
    const finalStatus: string = status ?? "draft";

    const product = await ProductModel.create({
      name: name.trim(),
      sku:  sku.trim().toUpperCase(),
      mpn:  mpn?.trim() ?? undefined,
      slug: finalSlug,
      brandId:   brandId   || undefined,
      brandName,
      brandSlug,
      categories,
      shortDescription: shortDescription?.trim() ?? undefined,
      description:      description?.trim()      ?? undefined,
      status: finalStatus,
      specifications: specs,
      pricing: {
        listPrice: listPrice ? parseFloat(listPrice) : undefined,
        currency:  currency  ?? "GHS",
      },
      inventory: {
        stockQty: stockQty ? parseInt(stockQty, 10) : 0,
        managed:  true,
      },
      seo: {
        metaTitle:       metaTitle?.trim()       || name.trim(),
        metaDescription: metaDescription?.trim() ?? undefined,
      },
    });

    // Index in Meilisearch if active
    if (finalStatus === "active") {
      const indexCats = catRows.map((c) => ({
        _id:   c._id,
        name:  c.name,
        slug:  c.slug,
        level: c.level as CategoryForIndex["level"],
      }));
      const record = buildProductRecord(
        {
          _id:              product._id,
          sku:              product.sku  as string,
          mpn:              product.mpn  as string,
          name:             product.name as string,
          shortDescription: product.shortDescription as string | undefined,
          brandSlug:        brandSlug,
          pricing:          { listPrice: listPrice ? parseFloat(listPrice) : 0, currency: currency ?? "GHS" },
          inventory:        { quantity: stockQty ? parseInt(stockQty, 10) : 0, tracked: true },
        },
        brandName ?? "",
        indexCats,
      );
      upsertProductRecord(record).catch((err) =>
        console.error("[search] index-on-create failed:", err),
      );
    }

    return NextResponse.json({ id: product._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/products", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
