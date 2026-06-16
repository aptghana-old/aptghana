import { NextRequest, NextResponse } from "next/server";
import { connectDB, ResourceModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const body = await req.json();

    const doc = await ResourceModel.findById(id);
    if (!doc) return NextResponse.json({ error: "Resource not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};

    if (body.title !== undefined)       updates.title = body.title.trim();
    if (body.slug !== undefined)        updates.slug = (body.slug.trim() || slugify(body.title ?? doc.title)).toLowerCase();
    if (body.type !== undefined)        updates.type = body.type;
    if (body.tagline !== undefined)     updates.tagline = body.tagline;
    if (body.intro !== undefined)       updates.intro = body.intro;
    if (body.badge !== undefined)       updates.badge = body.badge;
    if (body.items !== undefined)       updates.items = Array.isArray(body.items) ? body.items : [];
    if (body.ctaLabel !== undefined || body.ctaHref !== undefined) {
      const cta = doc.cta as { label?: string; href?: string } | undefined;
      updates.cta = {
        label: body.ctaLabel ?? cta?.label ?? "Get in Touch",
        href:  body.ctaHref  ?? cta?.href  ?? "/contact",
      };
    }
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder;
    if (body.isFeatured !== undefined)   updates.isFeatured = body.isFeatured;
    if (body.status !== undefined)       updates.status = body.status;

    await ResourceModel.updateOne({ _id: id }, { $set: updates });
    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/resources/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    await ResourceModel.updateOne({ _id: id }, { $set: { status: "inactive" } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/resources/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
