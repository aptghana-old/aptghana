import { NextResponse } from "next/server";
import { connectDB, ProductModel } from "@apt/db";

export interface CompareProductData {
  id:               string;
  name:             string;
  slug:             string;
  sku?:             string;
  mpn?:             string;
  brandSlug:        string;
  brandName:        string;
  shortDescription?: string;
  imageUrl:         string;
  pricing: { listPrice: number; currency: string; minimumOrderQty?: number };
  inStock:      boolean;
  isClearance?: boolean;
  isNew?:       boolean;
  discount?:    number;
  specifications: { groupName: string; specs: { name: string; value: string; unit?: string }[] }[];
  features:       string[];
  certifications: string[];
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = (searchParams.get("ids") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);

    if (ids.length === 0) return NextResponse.json({ products: [] });

    await connectDB();

    const raw = await ProductModel.find({ _id: { $in: ids } })
      .select("name slug sku mpn brandSlug shortDescription images.main pricing inventory isClearance isNew discount specifications features certifications")
      .limit(4)
      .lean() as Record<string, unknown>[];

    const byId = new Map(raw.map((p) => [String(p._id), p]));
    const ordered = ids.map((id) => byId.get(id)).filter(Boolean) as Record<string, unknown>[];

    type RawSpec = { groupName?: string; specs?: { name?: string; value?: string; unit?: string }[] };

    const products: CompareProductData[] = ordered.map((p) => {
      const img       = (p.images as { main?: { url?: string } })?.main;
      const pricing   = (p.pricing   as { listPrice?: number; currency?: string; minimumOrderQty?: number }) ?? {};
      const inventory = (p.inventory as { quantity?: number }) ?? {};
      const specs     = ((p.specifications as RawSpec[]) ?? []).map((g) => ({
        groupName: g?.groupName ?? "",
        specs: (g?.specs ?? []).map((s) => ({
          name:  s?.name  ?? "",
          value: s?.value ?? "",
          unit:  s?.unit,
        })).filter((s) => s.name),
      })).filter((g) => g.groupName && g.specs.length > 0);

      const brandSlug = String(p.brandSlug ?? "");

      return {
        id:               String(p._id),
        name:             String(p.name ?? ""),
        slug:             String(p.slug ?? ""),
        sku:              p.sku  ? String(p.sku)  : undefined,
        mpn:              p.mpn  ? String(p.mpn)  : undefined,
        brandSlug,
        brandName:        brandSlug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        shortDescription: p.shortDescription ? String(p.shortDescription) : undefined,
        imageUrl:         img?.url ?? "",
        pricing: {
          listPrice:       pricing.listPrice       ?? 0,
          currency:        pricing.currency        ?? "USD",
          minimumOrderQty: pricing.minimumOrderQty ?? 1,
        },
        inStock:       (inventory.quantity ?? 0) > 0,
        isClearance:   Boolean(p.isClearance),
        isNew:         Boolean(p.isNew),
        discount:      p.discount ? Number(p.discount) : undefined,
        specifications: specs,
        features:       Array.isArray(p.features)       ? (p.features as string[])       : [],
        certifications: Array.isArray(p.certifications) ? (p.certifications as string[]) : [],
      };
    });

    return NextResponse.json({ products });
  } catch (err) {
    console.error("[compare API]", err);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
