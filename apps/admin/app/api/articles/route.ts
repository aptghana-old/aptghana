import { NextRequest, NextResponse } from "next/server";
import { connectDB, ArticleModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { slugify, estimateReadingTime } from "@/lib/articleHelpers";
import { articleCreateSchema, parseBody } from "@apt/types";

/** POST /api/articles — quick-create a draft (full editing happens on the detail page). */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;

  try {
    await connectDB();
    const session = await auth();
    const parsed = parseBody(articleCreateSchema, await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
    const body = parsed.data;

    const baseSlug = (body.slug?.trim() || slugify(body.title)).toLowerCase() || "untitled";
    let slug = baseSlug;
    let n = 1;
    while (await ArticleModel.findOne({ slug })) {
      slug = `${baseSlug}-${++n}`;
    }

    const article = await ArticleModel.create({
      title: body.title.trim(),
      slug,
      status: "draft",
      authorId: session?.user?.id,
      authorName: session?.user?.name,
      createdBy: session?.user?.id,
      readingTimeMinutes: estimateReadingTime(body.content ?? ""),
    });

    await recordAudit({
      entityType: "article",
      entityId: article._id,
      action: "article_created",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Created draft "${article.title}"`,
    });

    return NextResponse.json({ id: article._id.toString(), slug: article.slug }, { status: 201 });
  } catch (err) {
    console.error("POST /api/articles", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
