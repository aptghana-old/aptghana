import { NextRequest, NextResponse } from "next/server";
import { connectDB, IndustryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function GET() {
  const deny = await requirePermission("content:view");
  if (deny) return deny;
  try {
    await connectDB();
    const docs = await IndustryModel.find({ status: { $ne: "deleted" } })
      .select("_id slug name tagline status displayOrder isFeatured accentColor icon updatedAt")
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    return NextResponse.json({ industries: docs });
  } catch (err) {
    console.error("GET /api/industries", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(body.name)).toLowerCase();
    const exists = await IndustryModel.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: "An industry with this slug already exists" }, { status: 409 });
    }

    const doc = await IndustryModel.create({
      slug,
      name: body.name.trim(),
      tagline: body.tagline?.trim() ?? "",
      shortDescription: body.shortDescription?.trim() ?? "",
      challenge: body.challenge?.trim() ?? "",
      solutions: Array.isArray(body.solutions) ? body.solutions.filter(Boolean) : [],
      brands: Array.isArray(body.brands) ? body.brands.filter(Boolean) : [],
      clients: body.clients?.trim() ?? "",
      icon: body.icon?.trim() ?? "",
      accentColor: body.accentColor?.trim() ?? "#84CC16",
      displayOrder: body.displayOrder ?? 0,
      isFeatured: body.isFeatured ?? false,
      status: body.status ?? "active",
      ...(body.imageUrl ? { image: { url: body.imageUrl, alt: body.name.trim() } } : {}),
    });

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/industries", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
