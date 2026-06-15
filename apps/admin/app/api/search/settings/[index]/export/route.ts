import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

type Params = { params: Promise<{ index: string }> };

/**
 * GET /api/search/settings/[index]/export
 * Downloads the active config for the index as a JSON file.
 * Pass ?versionId=<id> to export a specific version.
 */
export async function GET(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index } = await params;
  const versionId = new URL(req.url).searchParams.get("versionId");

  try {
    await connectDB();

    const query = versionId
      ? { _id: versionId, index }
      : { index, isActive: true };

    const doc = await SearchConfigModel.findOne(query).lean();
    if (!doc) {
      return NextResponse.json({ error: "No active configuration found for this index" }, { status: 404 });
    }

    const payload = {
      exportedAt: new Date().toISOString(),
      index:      doc.index,
      version:    doc.version,
      note:       doc.note,
      settings:   doc.settings,
    };

    const filename = `search-config-${index}-v${doc.version}.json`;

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type":        "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
