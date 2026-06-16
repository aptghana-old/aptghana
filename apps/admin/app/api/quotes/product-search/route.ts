import { NextRequest, NextResponse } from "next/server";
import { connectDB, ProductModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

/** Lightweight product lookup for the quote editor's add/replace picker. */
export async function GET(req: NextRequest) {
  const deny = await requirePermission('quotes:view');
  if (deny) return deny;
  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ products: [] });

  try {
    await connectDB();
    const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const products = await ProductModel.find({
      status: "active",
      $or: [
        { sku: { $regex: safe, $options: "i" } },
        { mpn: { $regex: safe, $options: "i" } },
        { name: { $regex: safe, $options: "i" } },
      ],
    })
      .select("sku mpn name brandSlug images.main.url pricing.listPrice pricing.currency pricing.minimumOrderQty")
      .limit(10)
      .lean<{
        _id: unknown;
        sku: string;
        mpn?: string;
        name: string;
        brandSlug: string;
        images?: { main?: { url?: string } };
        pricing?: { listPrice?: number; currency?: string; minimumOrderQty?: number };
      }[]>();

    return NextResponse.json({
      products: products.map((p) => ({
        id: String(p._id),
        sku: p.sku,
        mpn: p.mpn,
        name: p.name,
        brandSlug: p.brandSlug,
        imageUrl: p.images?.main?.url ?? "",
        listPrice: p.pricing?.listPrice ?? 0,
        currency: p.pricing?.currency ?? "USD",
        minQty: p.pricing?.minimumOrderQty ?? 1,
      })),
    });
  } catch (err) {
    console.error("[admin product-search]", err);
    return NextResponse.json({ products: [] });
  }
}
