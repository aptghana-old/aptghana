import { NextRequest, NextResponse } from "next/server";
import { connectDB, ArticleModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { slugify, estimateReadingTime, sanitizeArticleHtml } from "@/lib/articleHelpers";

interface Params { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("content:view");
  if (deny) return deny;
  try {
    await connectDB();
    const { id } = await params;
    const article = await ArticleModel.findById(id).lean();
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(article);
  } catch (err) {
    console.error("GET /api/articles/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;

  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;
    const body = await req.json();

    const article = await ArticleModel.findById(id);
    if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    const direct = [
      "title", "excerpt", "category", "canonicalUrl",
    ] as const;
    for (const f of direct) if (body[f] !== undefined) updates[f] = body[f];
    if (body.content !== undefined) updates.content = sanitizeArticleHtml(body.content);

    if (body.slug !== undefined) {
      const nextSlug = (body.slug.trim() || slugify(body.title ?? article.title)).toLowerCase();
      if (nextSlug !== article.slug) {
        const clash = await ArticleModel.findOne({ slug: nextSlug, _id: { $ne: id } });
        if (clash) return NextResponse.json({ error: `Slug "${nextSlug}" already exists` }, { status: 409 });
        updates.slug = nextSlug;
      }
    }

    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];
    if (body.featured !== undefined) updates.featured = Boolean(body.featured);
    if (body.featuredImage !== undefined) updates.featuredImage = body.featuredImage;
    if (body.gallery !== undefined) updates.gallery = body.gallery;
    if (body.videos !== undefined) updates.videos = body.videos;
    if (body.attachments !== undefined) updates.attachments = body.attachments;
    if (body.seoTitle !== undefined || body.seoDescription !== undefined || body.seoKeywords !== undefined || body.ogImage !== undefined) {
      updates.seo = {
        title: body.seoTitle ?? article.seo?.title ?? "",
        description: body.seoDescription ?? article.seo?.description ?? "",
        keywords: body.seoKeywords ?? article.seo?.keywords ?? [],
        ogImage: body.ogImage ?? article.seo?.ogImage,
      };
    }

    if (body.content !== undefined) updates.readingTimeMinutes = estimateReadingTime(body.content);

    const fromStatus = article.status;
    if (body.status !== undefined) updates.status = body.status;
    if (body.publishDate !== undefined) updates.publishDate = body.publishDate ? new Date(body.publishDate) : undefined;
    // Publishing now with no explicit date stamps "now".
    if (body.status === "published" && !body.publishDate && !article.publishDate) updates.publishDate = new Date();

    updates.updatedBy = session?.user?.id;

    await ArticleModel.updateOne({ _id: id }, { $set: updates });

    await recordAudit({
      entityType: "article",
      entityId: article._id,
      action: body.status && body.status !== fromStatus ? "status_changed" : "article_updated",
      fromStatus,
      toStatus: body.status,
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Updated "${article.title}"`,
      meta: { fields: Object.keys(updates) },
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/articles/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("content:edit");
  if (deny) return deny;
  try {
    await connectDB();
    const session = await auth();
    const { id } = await params;

    const article = await ArticleModel.findById(id).select("title");
    if (!article) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await ArticleModel.deleteOne({ _id: id });

    await recordAudit({
      entityType: "article",
      entityId: id,
      action: "article_deleted",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Deleted "${article.title}"`,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/articles/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
