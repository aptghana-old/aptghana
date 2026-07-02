import { NextRequest, NextResponse } from "next/server";
import { connectDB, BrandModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { slugify } from "@apt/types";

export async function POST(req: NextRequest) {
  const deny = await requirePermission('brands:create');
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();
    const { name, slug, description, shortDescription, country, website, logoUrl, status, isFeatured, isPartner } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Brand name is required" }, { status: 422 });
    }

    const finalSlug = (slug?.trim() || slugify(name)).toLowerCase();

    const existing = await BrandModel.findOne({ slug: finalSlug });
    if (existing) {
      return NextResponse.json({ error: `Slug "${finalSlug}" is already in use` }, { status: 409 });
    }

    const brand = await BrandModel.create({
      name: name.trim(),
      slug: finalSlug,
      description: description?.trim() ?? "",
      shortDescription: shortDescription?.trim() ?? "",
      country: country || undefined,
      website: website?.trim() || undefined,
      logo: { url: logoUrl?.trim() || "", alt: name.trim() },
      status: status ?? "active",
      isFeatured: isFeatured ?? false,
      isPartner: isPartner ?? false,
    });

    return NextResponse.json({ id: brand._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/brands", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
