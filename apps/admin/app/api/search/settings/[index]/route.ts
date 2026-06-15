import { NextRequest, NextResponse } from "next/server";
import { connectDB, SearchConfigModel } from "@apt/db";
import {
  getLiveSettings,
  DEFAULT_SETTINGS_BY_INDEX,
  applySettingsToIndex,
} from "@apt/search";
import { requireAdmin } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import type { MeiliSettings } from "@apt/types";

type Params = { params: Promise<{ index: string }> };

/** GET /api/search/settings/[index] — active DB config + live Meilisearch state */
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index } = await params;

  try {
    await connectDB();
    const [dbConfig, liveSettings] = await Promise.all([
      SearchConfigModel.findOne({ index, isActive: true }).lean(),
      getLiveSettings(index),
    ]);

    return NextResponse.json({ dbConfig, liveSettings });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

/**
 * POST /api/search/settings/[index]
 * Body: { settings: MeiliSettings, note?: string, apply?: boolean }
 * Creates a new version (draft or applied).
 */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index } = await params;

  let body: { settings: MeiliSettings; note?: string; apply?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { settings, note = "", apply = false } = body;

  if (!settings || typeof settings !== "object") {
    return NextResponse.json({ error: "settings is required" }, { status: 400 });
  }

  try {
    await connectDB();
    const session = await auth();
    const adminName = session?.user?.email ?? "unknown";

    // Determine next version number
    const last = await SearchConfigModel.findOne({ index })
      .sort({ version: -1 })
      .select("version")
      .lean();
    const version = (last?.version ?? 0) + 1;

    // If applying, deactivate current active version
    if (apply) {
      await SearchConfigModel.updateMany(
        { index, isActive: true },
        { $set: { isActive: false } },
      );
    }

    const doc = await SearchConfigModel.create({
      index,
      version,
      note,
      isActive: apply,
      appliedAt: apply ? new Date() : null,
      appliedBy: apply ? adminName : null,
      settings,
      createdBy: adminName,
    });

    if (apply) {
      await applySettingsToIndex(index, settings);
    }

    return NextResponse.json({ config: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}

/**
 * PUT /api/search/settings/[index]
 * Seeds the default config for this index if no versions exist.
 */
export async function PUT(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;

  const { index } = await params;

  try {
    await connectDB();
    const exists = await SearchConfigModel.exists({ index });
    if (exists) {
      return NextResponse.json({ error: "Config already exists — use POST to create a new version" }, { status: 409 });
    }

    const session = await auth();
    const adminName = session?.user?.email ?? "system";
    const defaults  = DEFAULT_SETTINGS_BY_INDEX[index];

    if (!defaults) {
      return NextResponse.json({ error: `No default config defined for index "${index}"` }, { status: 404 });
    }

    const doc = await SearchConfigModel.create({
      index,
      version:   1,
      note:      "Initial default configuration",
      isActive:  true,
      appliedAt: new Date(),
      appliedBy: adminName,
      settings:  defaults,
      createdBy: adminName,
    });

    await applySettingsToIndex(index, defaults);

    return NextResponse.json({ config: doc }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Operation failed" }, { status: 500 });
  }
}
