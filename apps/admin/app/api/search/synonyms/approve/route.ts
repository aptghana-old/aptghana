import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { applySettingsToIndex } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

const INDEX = "products";

/**
 * Approves a detected synonym opportunity from the Search Gaps page: merges
 * the bidirectional pair into the active `products` index config, creates a
 * new applied version (consistent with the settings-history workflow at
 * /dashboard/search/settings), and pushes it live to Meilisearch.
 */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("search:edit");
  if (deny) return deny;

  let body: { term?: string; synonym?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const term = body.term?.trim().toLowerCase();
  const synonym = body.synonym?.trim().toLowerCase();
  if (!term || !synonym) {
    return NextResponse.json({ error: "term and synonym are required" }, { status: 422 });
  }

  try {
    await connectDB();
    const session = await auth();
    const adminName = session?.user?.email ?? "unknown";

    const active = await SearchConfigModel.findOne({ index: INDEX, isActive: true }).lean();
    if (!active) {
      return NextResponse.json({ error: "No active configuration for the products index — create one in Search Settings first." }, { status: 409 });
    }

    const synonyms: Record<string, string[]> = { ...(active.settings.synonyms as Record<string, string[]> ?? {}) };
    synonyms[term] = Array.from(new Set([...(synonyms[term] ?? []), synonym]));
    synonyms[synonym] = Array.from(new Set([...(synonyms[synonym] ?? []), term]));

    const settings = { ...active.settings, synonyms };

    const last = await SearchConfigModel.findOne({ index: INDEX }).sort({ version: -1 }).select("version").lean();
    const version = (last?.version ?? 0) + 1;

    await SearchConfigModel.updateMany({ index: INDEX, isActive: true }, { $set: { isActive: false } });
    const doc = await SearchConfigModel.create({
      index: INDEX,
      version,
      note: `Synonym approved from Search Gaps: "${term}" ↔ "${synonym}"`,
      isActive: true,
      appliedAt: new Date(),
      appliedBy: adminName,
      settings,
      createdBy: adminName,
    });

    await applySettingsToIndex(INDEX, settings);

    return NextResponse.json({ id: doc._id.toString(), version }, { status: 201 });
  } catch (err) {
    console.error("POST /api/search/synonyms/approve", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
