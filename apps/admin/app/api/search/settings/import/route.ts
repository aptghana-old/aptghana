import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import type { MeiliSettings } from "@apt/types";

const REQUIRED_SETTING_KEYS: (keyof MeiliSettings)[] = [
  "searchableAttributes",
  "filterableAttributes",
  "sortableAttributes",
  "rankingRules",
  "synonyms",
];

/**
 * POST /api/search/settings/import
 * Body: { index, settings, note? }  or a full export JSON blob
 * Creates a new draft version from imported JSON (does NOT auto-apply).
 */
export async function POST(req: NextRequest) {
  const deny = await requireAdmin();
  if (deny) return deny;

  let body: {
    index?: string;
    settings?: MeiliSettings;
    note?: string;
    // Also accept a raw export blob
    exportedAt?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { index, settings, note = "Imported configuration" } = body;

  if (!index || typeof index !== "string") {
    return NextResponse.json({ error: "index is required" }, { status: 400 });
  }
  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings object is required" }, { status: 400 });
  }

  // Validate required keys are present
  const missing = REQUIRED_SETTING_KEYS.filter((k) => !(k in settings));
  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required settings keys: ${missing.join(", ")}` },
      { status: 422 },
    );
  }

  try {
    await connectDB();
    const session   = await auth();
    const adminName = session?.user?.email ?? "unknown";

    const last = await SearchConfigModel.findOne({ index })
      .sort({ version: -1 })
      .select("version")
      .lean();
    const version = (last?.version ?? 0) + 1;

    const doc = await SearchConfigModel.create({
      index,
      version,
      note,
      isActive:  false,
      appliedAt: null,
      appliedBy: null,
      settings: {
        searchableAttributes: settings.searchableAttributes ?? [],
        filterableAttributes: settings.filterableAttributes ?? [],
        sortableAttributes:   settings.sortableAttributes   ?? [],
        rankingRules:         settings.rankingRules         ?? [],
        synonyms:             settings.synonyms             ?? {},
        stopWords:            settings.stopWords            ?? [],
        distinctAttribute:    settings.distinctAttribute    ?? null,
        typoTolerance: settings.typoTolerance ?? {
          enabled: true,
          minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 },
          disableOnWords: [],
          disableOnAttributes: [],
        },
        faceting:           settings.faceting           ?? { maxValuesPerFacet: 100 },
        pagination:         settings.pagination         ?? { maxTotalHits: 1000 },
        dictionary:         settings.dictionary         ?? [],
        separatorTokens:    settings.separatorTokens    ?? [],
        nonSeparatorTokens: settings.nonSeparatorTokens ?? [],
      },
      createdBy: adminName,
    });

    return NextResponse.json({ config: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
