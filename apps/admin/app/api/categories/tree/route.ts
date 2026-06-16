import { NextRequest, NextResponse } from "next/server";
import { connectDB, CategoryModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { getLiveProductCounts } from "@/lib/categoryHierarchy";

interface RawCategory {
  _id: { toString(): string };
  name: string;
  slug: string;
  level: string;
  status: string;
  displayOrder: number;
}

/**
 * GET /api/categories/tree?parentId=<id>     — lazy-load one level of children (root if omitted)
 * GET /api/categories/tree?q=<text>          — search all levels/statuses, with ancestor breadcrumb
 */
export async function GET(req: NextRequest) {
  const deny = await requirePermission("categories:view");
  if (deny) return deny;

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim();
  const parentId = sp.get("parentId") || undefined;

  try {
    await connectDB();

    if (q) {
      const safe = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const matches = await CategoryModel.find({ name: { $regex: safe, $options: "i" } })
        .select("name slug level status displayOrder ancestors")
        .limit(50)
        .populate({ path: "ancestors", select: "name slug level" })
        .lean<(RawCategory & { ancestors?: { name: string; slug: string; level: string }[] })[]>();

      const counts = await getLiveProductCounts(matches.map((m) => m._id.toString()));
      const nodes = matches.map((m) => ({
        id: m._id.toString(), name: m.name, slug: m.slug, level: m.level, status: m.status,
        displayOrder: m.displayOrder, productCount: counts.get(m._id.toString()) ?? 0,
        breadcrumb: (m.ancestors ?? []).map((a) => ({ name: a.name, slug: a.slug })),
      }));
      return NextResponse.json({ nodes, mode: "search" });
    }

    const query = parentId ? { parentId } : { parentId: { $exists: false } };
    const children = await CategoryModel.find(query)
      .select("name slug level status displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean<RawCategory[]>();

    const ids = children.map((c) => c._id.toString());
    const [counts, childCountRows] = await Promise.all([
      getLiveProductCounts(ids),
      CategoryModel.aggregate<{ _id: string; count: number }>([
        { $match: { parentId: { $in: ids.length ? children.map((c) => c._id) : [] } } },
        { $group: { _id: { $toString: "$parentId" }, count: { $sum: 1 } } },
      ]),
    ]);
    const childCountMap = new Map(childCountRows.map((r) => [r._id, r.count]));

    const nodes = children.map((c) => ({
      id: c._id.toString(), name: c.name, slug: c.slug, level: c.level, status: c.status,
      displayOrder: c.displayOrder, productCount: counts.get(c._id.toString()) ?? 0,
      hasChildren: (childCountMap.get(c._id.toString()) ?? 0) > 0,
    }));

    return NextResponse.json({ nodes, mode: "children" });
  } catch (err) {
    console.error("GET /api/categories/tree", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
