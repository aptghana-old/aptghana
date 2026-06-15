import { NextRequest, NextResponse } from "next/server";
import { connectDB, CompanyPageModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const doc = await CompanyPageModel.findById(id);
    if (!doc) return NextResponse.json({ error: "Page not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined)           updates.title           = body.title.trim();
    if (body.slug !== undefined)            updates.slug            = (body.slug.trim() || slugify(body.title ?? doc.title)).toLowerCase();
    if (body.tagline !== undefined)         updates.tagline         = body.tagline;
    if (body.icon !== undefined)            updates.icon            = body.icon;
    if (body.cardDescription !== undefined) updates.cardDescription = body.cardDescription;
    if (body.intro !== undefined)           updates.intro           = body.intro;
    if (body.sections !== undefined)        updates.sections        = Array.isArray(body.sections)
      ? body.sections.filter((s: { heading?: string }) => s.heading?.trim())
      : [];
    if (body.ctaLabel !== undefined)        updates.ctaLabel        = body.ctaLabel;
    if (body.ctaHref !== undefined)         updates.ctaHref         = body.ctaHref;
    if (body.displayOrder !== undefined)    updates.displayOrder    = body.displayOrder;
    if (body.status !== undefined)          updates.status          = body.status;

    await CompanyPageModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/company/pages/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const result = await CompanyPageModel.deleteOne({ _id: id });
    if (result.deletedCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/company/pages/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
