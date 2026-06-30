import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel } from "@apt/db";

const PRODUCT_SELECT =
  "name slug sku brandSlug brandName images pricing inventory discount isClearance isNew primaryCategoryId";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { skus?: unknown; currentSku?: unknown; limit?: unknown };

    const skus = Array.isArray(body.skus) ? (body.skus as string[]).filter(Boolean).slice(0, 20) : [];
    const currentSku = typeof body.currentSku === "string" ? body.currentSku : "";
    const limit = Math.min(24, Math.max(1, Number(body.limit) || 12));

    if (!skus.length) {
      return NextResponse.json({ products: [] });
    }

    await connectDB();

    /* ── Gather signals from viewed products ── */
    const viewed = await (ProductModel as any)
      .find({ sku: { $in: skus } })
      .select("brandSlug primaryCategoryId relatedProducts accessories replacements tags")
      .lean() as Array<{
        brandSlug: string;
        primaryCategoryId?: string;
        relatedProducts?: unknown[];
        accessories?: unknown[];
        replacements?: unknown[];
        tags?: string[];
      }>;

    if (!viewed.length) {
      return NextResponse.json({ products: [] });
    }

    const brandSlugs   = [...new Set(viewed.map((p) => p.brandSlug).filter(Boolean))];
    const categoryIds  = [...new Set(viewed.map((p) => p.primaryCategoryId?.toString()).filter(Boolean))];
    const allTags      = [...new Set(viewed.flatMap((p) => p.tags ?? []).filter(Boolean))];

    const explicitIds  = [
      ...new Set([
        ...viewed.flatMap((p) => (p.relatedProducts  ?? []).map((id) => String(id))),
        ...viewed.flatMap((p) => (p.accessories      ?? []).map((id) => String(id))),
        ...viewed.flatMap((p) => (p.replacements     ?? []).map((id) => String(id))),
      ])
    ];

    /* ── Build $or query ── */
    const orClauses: object[] = [];
    if (explicitIds.length)  orClauses.push({ _id: { $in: explicitIds } });
    if (categoryIds.length)  orClauses.push({ primaryCategoryId: { $in: categoryIds } });
    if (brandSlugs.length)   orClauses.push({ brandSlug: { $in: brandSlugs } });
    if (allTags.length)      orClauses.push({ tags: { $in: allTags } });

    const candidates = await (ProductModel as any)
      .find({
        status: "active",
        sku: { $nin: [...skus, currentSku] },
        $or: orClauses,
      })
      .select(PRODUCT_SELECT)
      .limit(limit * 5)
      .lean() as any[];

    /* ── Score by relevance ── */
    const explicitSet  = new Set(explicitIds);
    const categorySet  = new Set(categoryIds);
    const brandSet     = new Set(brandSlugs);
    const tagSet       = new Set(allTags);

    const scored = candidates.map((p: any) => {
      let score = 0;
      if (explicitSet.has(p._id.toString()))               score += 20; // explicitly related/accessory
      if (categorySet.has(p.primaryCategoryId?.toString())) score += 8;  // same category
      if (tagSet.size && (p.tags ?? []).some((t: string) => tagSet.has(t))) score += 5; // shared tags
      if (brandSet.has(p.brandSlug))                        score += 3;  // same brand
      if (p.isNew)                                          score += 1;
      if ((p.discount ?? 0) > 0)                           score += 1;
      return { p, score };
    });

    scored.sort((a, b) => b.score - a.score || Math.random() - 0.5);

    const products = scored.slice(0, limit).map(({ p }) => ({
      id:        p._id.toString(),
      name:      p.name,
      slug:      (p.sku ?? "").toLowerCase(),
      sku:       p.sku,
      brandSlug: p.brandSlug,
      brandName: p.brandName,
      image:     { url: p.images?.main?.url ?? "", alt: p.images?.main?.alt ?? p.name },
      pricing:   { listPrice: p.pricing?.listPrice ?? 0, currency: p.pricing?.currency ?? "GHS" },
      inStock:   (p.inventory?.quantity ?? 0) > 0,
      isClearance: !!p.isClearance,
      isNew:     !!p.isNew,
      discount:  p.discount ?? 0,
    }));

    return NextResponse.json({ products }, {
      headers: { "Cache-Control": "private, max-age=300" },
    });
  } catch (err) {
    console.error("[recommendations]", err);
    return NextResponse.json({ products: [] });
  }
}
