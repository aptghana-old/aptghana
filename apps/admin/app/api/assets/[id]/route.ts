import { NextResponse } from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { deleteFile, copyFile, keyToUrl } from "@apt/storage";
import { indexAsset, removeAssetFromIndex } from "@apt/search";
import { randomUUID } from "crypto";
import { requireAdmin } from "@/lib/auth/require";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_req: Request, { params }: RouteContext) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id } = await params;
    await connectDB();
    const asset = await AssetModel.findById(id).lean();
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ ok: true, asset: serialize(asset as Record<string, unknown>) });
  } catch (err) {
    console.error("[GET /api/assets/[id]]", err);
    return NextResponse.json({ error: "Failed to load asset" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: RouteContext) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id } = await params;
    const body = await req.json() as {
      filename?: string;
      altText?: string;
      description?: string;
      tags?: string[];
      folder?: string;
      isFavorite?: boolean;
      width?: number;
      height?: number;
      pageCount?: number;
    };

    await connectDB();
    const asset = await AssetModel.findById(id);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (body.filename    !== undefined) asset.filename    = body.filename;
    if (body.altText     !== undefined) asset.altText     = body.altText;
    if (body.description !== undefined) asset.description = body.description;
    if (body.tags        !== undefined) asset.tags        = body.tags;
    if (body.isFavorite  !== undefined) asset.isFavorite  = body.isFavorite;
    if (body.width       !== undefined) asset.width       = body.width;
    if (body.height      !== undefined) asset.height      = body.height;
    if (body.pageCount   !== undefined) asset.pageCount   = body.pageCount;

    // Move to new folder: copy object in MinIO, delete old, update key/url
    if (body.folder && body.folder !== asset.folder) {
      const oldKey  = asset.key;
      const newKey  = `${body.folder}/${asset.filename}`;
      try {
        await copyFile(oldKey, newKey);
        await deleteFile(oldKey);
        asset.key    = newKey;
        asset.url    = keyToUrl(newKey);
        asset.folder = body.folder;
      } catch {
        return NextResponse.json({ error: "Failed to move file" }, { status: 500 });
      }
    }

    await asset.save();
    void indexAsset(asset as never);

    return NextResponse.json({ ok: true, asset: serialize(asset.toObject()) });
  } catch (err) {
    console.error("[PATCH /api/assets/[id]]", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: RouteContext) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id } = await params;
    const url    = new URL(req.url);
    const force  = url.searchParams.get("force") === "true";

    await connectDB();
    const asset = await AssetModel.findById(id);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (asset.usedIn && asset.usedIn.length > 0 && !force) {
      return NextResponse.json(
        {
          error:  "Asset is in use",
          usedIn: asset.usedIn,
          hint:   "Pass ?force=true to delete anyway",
        },
        { status: 409 },
      );
    }

    await deleteFile(asset.key);
    await AssetModel.findByIdAndDelete(id);
    void removeAssetFromIndex(id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/assets/[id]]", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}

// POST /api/assets/[id] — actions: archive, restore, duplicate, increment-view
export async function POST(req: Request, { params }: RouteContext) {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    const { id } = await params;
    const body   = await req.json() as { action?: string };

    await connectDB();
    const asset = await AssetModel.findById(id);
    if (!asset) return NextResponse.json({ error: "Not found" }, { status: 404 });

    switch (body.action) {
      case "archive":
        asset.status = "archived";
        await asset.save();
        void indexAsset(asset as never);
        return NextResponse.json({ ok: true, status: "archived" });

      case "restore":
        asset.status = "active";
        await asset.save();
        void indexAsset(asset as never);
        return NextResponse.json({ ok: true, status: "active" });

      case "duplicate": {
        const newKey    = `${asset.folder}/${randomUUID().slice(0, 8)}-copy-${asset.filename}`;
        await copyFile(asset.key, newKey);
        const duplicate = await AssetModel.create({
          ...asset.toObject(),
          _id:          undefined,
          key:          newKey,
          url:          keyToUrl(newKey),
          filename:     `copy-${asset.filename}`,
          originalName: `copy-${asset.originalName}`,
          downloadCount: 0,
          viewCount:    0,
          isFavorite:   false,
          usedIn:       [],
        });
        void indexAsset(duplicate as never);
        return NextResponse.json({ ok: true, asset: serialize(duplicate.toObject()) }, { status: 201 });
      }

      case "increment-view":
        await AssetModel.findByIdAndUpdate(id, { $inc: { viewCount: 1 } });
        return NextResponse.json({ ok: true });

      case "increment-download":
        await AssetModel.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });
        return NextResponse.json({ ok: true });

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (err) {
    console.error("[POST /api/assets/[id]]", err);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}

function serialize(doc: Record<string, unknown>): Record<string, unknown> {
  return JSON.parse(JSON.stringify(doc));
}
