import { NextRequest, NextResponse }    from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { searchAssets }   from "@apt/search";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(60, 60 * 1000);

// Maps the ?type= URL param to a MongoDB filter
function buildTypeFilter(type: string): Record<string, unknown> | null {
  switch (type) {
    case "datasheets":
      return { $or: [{ folder: { $regex: "^datasheets", $options: "i" } }, { mimetype: "application/pdf", folder: { $not: /^(manuals|guides|certificates)/i } }] };
    case "manuals":
      return { folder: { $regex: "^manuals", $options: "i" } };
    case "guides":
      return { folder: { $regex: "^guides", $options: "i" } };
    case "videos":
      return { mimetype: { $regex: "^video/", $options: "i" } };
    case "software":
      return { folder: { $regex: "^software", $options: "i" } };
    case "certificates":
      return { folder: { $regex: "^certificates", $options: "i" } };
    default:
      return null;
  }
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  try {
    const url   = new URL(req.url);
    const type  = url.searchParams.get("type")  ?? "";
    const q     = url.searchParams.get("q")     ?? "";
    const brand = url.searchParams.get("brand") ?? "";
    const page  = Math.max(1, Number(url.searchParams.get("page")  ?? 1));
    const limit = Math.min(48, Math.max(1, Number(url.searchParams.get("limit") ?? 24)));

    // ── Meilisearch path for text queries ───────────────────────────────
    if (q.trim()) {
      const folder = type === "videos" ? undefined : (type || undefined);
      const mediaType =
        type === "videos" ? "video" :
        type === "software" ? "archive" :
        (type === "datasheets" || type === "manuals" || type === "guides" || type === "certificates") ? "pdf" :
        undefined;

      const result = await searchAssets(q.trim(), {
        folder,
        mediaType,
        status: "active",
        page,
        limit,
      });

      return NextResponse.json({
        ok:    true,
        assets: result.hits.map((h) => ({ ...h, _id: h.id })),
        total:  result.estimatedTotalHits ?? result.hits.length,
        page,
        pages:  Math.ceil((result.estimatedTotalHits ?? result.hits.length) / limit),
      });
    }

    // ── MongoDB path ─────────────────────────────────────────────────────
    await connectDB();

    const query: Record<string, unknown> = { status: "active" };

    const typeFilter = buildTypeFilter(type);
    if (typeFilter) Object.assign(query, typeFilter);

    if (brand) {
      const safeBrand = brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      query.$or = [
        { tags:        { $regex: safeBrand, $options: "i" } },
        { filename:    { $regex: safeBrand, $options: "i" } },
        { description: { $regex: safeBrand, $options: "i" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [rawAssets, total, byType] = await Promise.all([
      AssetModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("_id key url filename originalName mimetype size folder tags altText description thumbnails createdAt updatedAt downloadCount viewCount isFavorite")
        .lean(),
      AssetModel.countDocuments(query),
      // Count by resource type for sidebar numbers
      AssetModel.aggregate([
        { $match: { status: "active" } },
        {
          $group: {
            _id: {
              $switch: {
                branches: [
                  { case: { $regexMatch: { input: "$mimetype", regex: "^video/" } },                           then: "videos"      },
                  { case: { $regexMatch: { input: "$folder",   regex: "^manuals",      options: "i" } },       then: "manuals"     },
                  { case: { $regexMatch: { input: "$folder",   regex: "^guides",       options: "i" } },       then: "guides"      },
                  { case: { $regexMatch: { input: "$folder",   regex: "^software",     options: "i" } },       then: "software"    },
                  { case: { $regexMatch: { input: "$folder",   regex: "^certificates", options: "i" } },       then: "certificates"},
                  { case: { $regexMatch: { input: "$folder",   regex: "^datasheets",   options: "i" } },       then: "datasheets"  },
                  { case: { $eq: ["$mimetype", "application/pdf"] },                                           then: "datasheets"  },
                ],
                default: "other",
              },
            },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    const countMap = Object.fromEntries(
      byType.map((b: { _id: string; count: number }) => [b._id, b.count]),
    );

    const assets = rawAssets.map((a) => {
      const doc = a as unknown as { _id: { toString(): string } };
      return { ...a, _id: doc._id.toString() };
    });

    return NextResponse.json({
      ok:     true,
      assets: JSON.parse(JSON.stringify(assets)),
      total,
      page,
      pages:  Math.ceil(total / limit),
      counts: countMap,
    });
  } catch (err) {
    console.error("[GET /api/library]", err);
    return NextResponse.json({ error: "Failed to load library" }, { status: 500 });
  }
}
