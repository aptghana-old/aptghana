import { NextRequest, NextResponse } from "next/server";
import { connectDB, CompanyPageModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

function slugify(t: string) {
  return t.toLowerCase().replace(/[^\w\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();
}

export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();

    if (!body.title?.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const slug = (body.slug?.trim() || slugify(body.title)).toLowerCase();
    const exists = await CompanyPageModel.findOne({ slug });
    if (exists) {
      return NextResponse.json({ error: `Slug "${slug}" already exists` }, { status: 409 });
    }

    const doc = await CompanyPageModel.create({
      slug,
      title:           body.title.trim(),
      tagline:         body.tagline?.trim()        ?? "",
      icon:            body.icon?.trim()           ?? "",
      cardDescription: body.cardDescription?.trim() ?? "",
      intro:           body.intro?.trim()          ?? "",
      sections:        Array.isArray(body.sections) ? body.sections.filter((s: { heading?: string }) => s.heading?.trim()) : [],
      ctaLabel:        body.ctaLabel?.trim()       ?? "Get in Touch",
      ctaHref:         body.ctaHref?.trim()        ?? "/contact",
      displayOrder:    body.displayOrder           ?? 0,
      status:          body.status                 ?? "active",
    });

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/company/pages", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
