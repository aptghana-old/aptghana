import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { applySettingsToIndex } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

type Params = { params: Promise<{ index: string; id: string }> };

/**
 * POST /api/search/settings/[index]/versions/[id]/apply
 * Applies this version's settings to Meilisearch and marks it as active.
 */
export async function POST(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission('search:edit');
  if (deny) return deny;

  const { index, id } = await params;

  try {
    await connectDB();
    const session = await auth();
    const adminName = session?.user?.email ?? "unknown";

    const target = await SearchConfigModel.findOne({ _id: id, index }).lean();
    if (!target) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Deactivate all other versions for this index
    await SearchConfigModel.updateMany(
      { index, isActive: true },
      { $set: { isActive: false } },
    );

    // Apply to Meilisearch
    await applySettingsToIndex(index, target.settings);

    // Mark this version as active
    const updated = await SearchConfigModel.findByIdAndUpdate(
      id,
      {
        $set: {
          isActive:  true,
          appliedAt: new Date(),
          appliedBy: adminName,
        },
      },
      { new: true },
    ).lean();

    return NextResponse.json({ config: updated });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
