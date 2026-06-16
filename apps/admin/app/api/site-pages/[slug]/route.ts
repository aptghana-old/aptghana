import { NextRequest, NextResponse } from "next/server";
import { connectDB, SitePageModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("content:view");
  if (deny) return deny;
  try {
    await connectDB();
    const { slug } = await params;
    const doc = await SitePageModel.findOne({ slug }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(doc);
  } catch (err) {
    console.error("GET /api/site-pages/[slug]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const { slug } = await params;
    const body = await req.json();

    const doc = await SitePageModel.findOne({ slug });
    if (!doc) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    const strings = [
      "title", "tagline", "description", "lastUpdated", "intro",
      "contactBlockName", "contactBlockEmail", "contactBlockAddress", "contactBlockFootnote",
      "address", "phone", "email", "mapsUrl", "responseTime",
      "metaTitle", "metaDescription", "status",
    ] as const;

    for (const key of strings) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (body.sections !== undefined) {
      updates.sections = Array.isArray(body.sections)
        ? body.sections.filter((s: { heading?: string }) => s.heading?.trim())
        : [];
    }
    if (body.officeHours !== undefined) {
      updates.officeHours = Array.isArray(body.officeHours)
        ? body.officeHours.filter((h: { day?: string }) => h.day?.trim())
        : [];
    }

    await SitePageModel.updateOne({ slug }, { $set: updates });
    return NextResponse.json({ slug });
  } catch (err) {
    console.error("PATCH /api/site-pages/[slug]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
