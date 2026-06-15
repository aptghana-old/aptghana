import { NextResponse } from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { getMediaType } from "@apt/search";
import { requireAdmin } from "@/lib/auth/require";

const PAGE_SIZE = 50;

export async function GET(req: Request) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const url        = new URL(req.url);
    const folder     = url.searchParams.get("folder")    ?? undefined;
    const mediaType  = url.searchParams.get("mediaType") ?? undefined;
    const status     = url.searchParams.get("status")    ?? "active";
    const tags       = url.searchParams.get("tags")?.split(",").filter(Boolean) ?? [];
    const sort       = url.searchParams.get("sort")       ?? "newest";
    const page       = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit      = Math.min(100, Math.max(1, Number(url.searchParams.get("limit") ?? PAGE_SIZE)));
    const isFavorite = url.searchParams.get("favorites") === "true" ? true : undefined;

    await connectDB();

    const query: Record<string, unknown> = { status };

    if (folder) {
      // Match folder exactly or as prefix (sub-folders)
      if (url.searchParams.get("recursive") === "true") {
        query.folder = { $regex: `^${folder.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, $options: "i" };
      } else {
        query.folder = folder;
      }
    }
    if (mediaType) {
      // Derive MIME prefix from mediaType for MongoDB query
      const mimeFilter = mimeFilterForMediaType(mediaType);
      if (mimeFilter) query.mimetype = mimeFilter;
    }
    if (tags.length > 0) query.tags = { $all: tags };
    if (isFavorite)      query.isFavorite = true;

    const sortMap: Record<string, [string, 1 | -1][]> = {
      newest:  [["createdAt", -1]],
      oldest:  [["createdAt",  1]],
      name:    [["filename",   1]],
      size:    [["size",      -1]],
      popular: [["viewCount", -1]],
    };
    const sortOrder = sortMap[sort] ?? sortMap.newest;

    const skip = (page - 1) * limit;

    const [assets, total] = await Promise.all([
      AssetModel.find(query)
        .sort(sortOrder)
        .skip(skip)
        .limit(limit)
        .lean(),
      AssetModel.countDocuments(query),
    ]);

    // Enrich with mediaType (computed field)
    const enriched = assets.map((a) => {
      const doc = a as unknown as { _id: { toString(): string }; mimetype: string };
      return { ...a, _id: doc._id.toString(), mediaType: getMediaType(doc.mimetype) };
    });

    return NextResponse.json({
      ok:    true,
      assets: enriched,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error("[GET /api/assets]", err);
    return NextResponse.json({ error: "Failed to load assets" }, { status: 500 });
  }
}

function mimeFilterForMediaType(type: string): Record<string, unknown> | null {
  switch (type) {
    case "image":       return { $regex: "^image/", $options: "i" };
    case "svg":         return { $in: ["image/svg+xml"] };
    case "video":       return { $regex: "^video/", $options: "i" };
    case "audio":       return { $regex: "^audio/", $options: "i" };
    case "pdf":         return { $in: ["application/pdf"] };
    case "document":    return { $in: ["application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"] };
    case "spreadsheet": return { $in: ["application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv"] };
    default:            return null;
  }
}
