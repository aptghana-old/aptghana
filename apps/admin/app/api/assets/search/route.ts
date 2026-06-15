import { NextResponse } from "next/server";
import { searchAssets, getMediaType } from "@apt/search";
import { connectDB, AssetModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

export async function GET(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const url       = new URL(req.url);
    const q         = url.searchParams.get("q")         ?? "";
    const folder    = url.searchParams.get("folder")    ?? undefined;
    const mediaType = url.searchParams.get("mediaType") ?? undefined;
    const tags      = url.searchParams.get("tags")?.split(",").filter(Boolean);
    const page      = Number(url.searchParams.get("page")  ?? 1);
    const limit     = Number(url.searchParams.get("limit") ?? 50);
    const status    = url.searchParams.get("status")    ?? "active";
    const sort      = url.searchParams.get("sort")       ?? "newest";

    // Fall back to MongoDB for empty queries (faster and avoids Meilisearch lag)
    if (!q.trim()) {
      await connectDB();

      const query: Record<string, unknown> = { status };
      if (folder)    query.folder  = folder;
      if (mediaType) query.mimetype = mimeRegexForType(mediaType);
      if (tags?.length) query.tags = { $all: tags };

      const sortMap: Record<string, [string, 1 | -1][]> = {
        newest:  [["createdAt", -1]],
        oldest:  [["createdAt",  1]],
        name:    [["filename",   1]],
        size:    [["size",      -1]],
      };

      const skip = (page - 1) * limit;
      const [assets, total] = await Promise.all([
        AssetModel.find(query).sort(sortMap[sort] ?? { createdAt: -1 }).skip(skip).limit(limit).lean(),
        AssetModel.countDocuments(query),
      ]);

      return NextResponse.json({
        ok:     true,
        assets: assets.map((a) => {
          const doc = a as unknown as { _id: { toString(): string }; mimetype: string };
          return { ...a, _id: doc._id.toString(), mediaType: getMediaType(doc.mimetype) };
        }),
        total,
        page,
        pages:  Math.ceil(total / limit),
        facets: null,
      });
    }

    const result = await searchAssets(q, { folder, mediaType, tags, status, page, limit, sort });

    return NextResponse.json({
      ok:     true,
      assets: result.hits.map((h) => ({
        ...h,
        _id: h.id,
      })),
      total:  result.estimatedTotalHits ?? result.hits.length,
      page,
      pages:  Math.ceil((result.estimatedTotalHits ?? result.hits.length) / limit),
      facets: result.facetDistribution ?? null,
    });
  } catch (err) {
    console.error("[GET /api/assets/search]", err);
    return NextResponse.json({ error: "Search failed" }, { status: 500 });
  }
}

function mimeRegexForType(type: string): { $regex: string; $options: string } | { $in: string[] } | undefined {
  switch (type) {
    case "image":  return { $regex: "^image/", $options: "i" };
    case "video":  return { $regex: "^video/", $options: "i" };
    case "audio":  return { $regex: "^audio/", $options: "i" };
    case "pdf":    return { $in: ["application/pdf"] };
    case "document": return { $in: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] };
    default:       return undefined;
  }
}
