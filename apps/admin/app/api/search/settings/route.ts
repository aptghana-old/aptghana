import { NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { INDEXES } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";

const ALL_INDEXES = Object.values(INDEXES);

/** GET /api/search/settings — summary card for every known index */
export async function GET() {
  const deny = await requirePermission('search:view');
  if (deny) return deny;

  try {
    await connectDB();

    const results = await Promise.all(
      ALL_INDEXES.map(async (indexName) => {
        const [active, total] = await Promise.all([
          SearchConfigModel.findOne({ index: indexName, isActive: true })
            .select("_id version note appliedAt appliedBy createdAt")
            .lean(),
          SearchConfigModel.countDocuments({ index: indexName }),
        ]);
        return { index: indexName, active, total };
      }),
    );

    return NextResponse.json({ indexes: results });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
