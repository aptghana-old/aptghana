import { NextRequest, NextResponse } from "next/server";
import { connectDB, ResourceModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function GET() {
  const deny = await requirePermission("content:view");
  if (deny) return deny;
  try {
    await connectDB();
    const docs = await ResourceModel.find({ status: { $ne: "deleted" } })
      .select("_id slug type title tagline badge status displayOrder isFeatured updatedAt")
      .sort({ displayOrder: 1, title: 1 })
      .lean();
    return NextResponse.json({ resources: docs });
  } catch (err) {
    console.error("GET /api/resources", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(body.title)).toLowerCase();
    const exists = await ResourceModel.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: "A resource with this slug already exists" }, { status: 409 });
    }

    const doc = await ResourceModel.create({
      slug,
      type: body.type ?? "other",
      title: body.title.trim(),
      tagline: body.tagline?.trim() ?? "",
      intro: body.intro?.trim() ?? "",
      badge: body.badge?.trim() ?? "",
      items: Array.isArray(body.items) ? body.items : [],
      cta: {
        label: body.ctaLabel?.trim() || "Get in Touch",
        href: body.ctaHref?.trim() || "/contact",
      },
      displayOrder: body.displayOrder ?? 0,
      isFeatured: body.isFeatured ?? false,
      status: body.status ?? "active",
    });

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/resources", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
