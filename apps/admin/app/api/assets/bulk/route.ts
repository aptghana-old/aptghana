import { NextResponse } from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { deleteFiles, copyFile, keyToUrl } from "@apt/storage";
import { removeAssetFromIndex, indexAssets } from "@apt/search";
import { requirePermission } from "@/lib/auth/require";

type BulkOperation = "delete" | "archive" | "restore" | "move" | "add-tags" | "remove-tags" | "favorite" | "unfavorite";

interface BulkBody {
  operation: BulkOperation;
  ids: string[];
  data?: {
    folder?: string;
    tags?: string[];
  };
}

export async function POST(req: Request) {
  const deny = await requirePermission('media:delete');
  if (deny) return deny;
  try {
    const body = await req.json() as BulkBody;
    const { operation, ids, data } = body;

    if (!operation || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "operation and ids are required" }, { status: 400 });
    }
    if (ids.length > 500) {
      return NextResponse.json({ error: "Maximum 500 items per bulk operation" }, { status: 400 });
    }

    await connectDB();

    switch (operation) {
      case "delete": {
        const url    = new URL(req.url);
        const force  = url.searchParams.get("force") === "true";
        const assets = await AssetModel.find({ _id: { $in: ids } }).lean();

        type LeanAsset = { _id: { toString(): string }; usedIn?: unknown[]; key: string };
        const leanAssets = assets as unknown as LeanAsset[];
        const inUse = leanAssets.filter((a) => !force && a.usedIn && a.usedIn.length > 0);
        if (inUse.length > 0 && !force) {
          return NextResponse.json(
            { error: `${inUse.length} asset(s) are in use. Pass ?force=true to delete anyway.`, inUse: inUse.map((a) => a._id.toString()) },
            { status: 409 },
          );
        }

        const keys = leanAssets.map((a) => a.key);
        await deleteFiles(keys);
        await AssetModel.deleteMany({ _id: { $in: ids } });
        for (const id of ids) void removeAssetFromIndex(id);

        return NextResponse.json({ ok: true, affected: ids.length });
      }

      case "archive": {
        await AssetModel.updateMany({ _id: { $in: ids } }, { status: "archived" });
        const updated = await AssetModel.find({ _id: { $in: ids } }).lean();
        void indexAssets(updated as never[]);
        return NextResponse.json({ ok: true, affected: ids.length });
      }

      case "restore": {
        await AssetModel.updateMany({ _id: { $in: ids } }, { status: "active" });
        const updated = await AssetModel.find({ _id: { $in: ids } }).lean();
        void indexAssets(updated as never[]);
        return NextResponse.json({ ok: true, affected: ids.length });
      }

      case "move": {
        const folder = data?.folder;
        if (!folder) return NextResponse.json({ error: "folder is required for move" }, { status: 400 });

        const assets  = await AssetModel.find({ _id: { $in: ids } });
        let moved = 0;
        for (const asset of assets) {
          try {
            const newKey = `${folder}/${asset.filename}`;
            await copyFile(asset.key, newKey);
            await AssetModel.findByIdAndUpdate(asset._id, {
              folder,
              key: newKey,
              url: keyToUrl(newKey),
            });
            moved++;
          } catch {
            // Skip failed moves
          }
        }
        const updated = await AssetModel.find({ _id: { $in: ids } }).lean();
        void indexAssets(updated as never[]);
        return NextResponse.json({ ok: true, affected: moved });
      }

      case "add-tags": {
        const tags = data?.tags ?? [];
        if (tags.length === 0) return NextResponse.json({ error: "tags required" }, { status: 400 });
        await AssetModel.updateMany({ _id: { $in: ids } }, { $addToSet: { tags: { $each: tags } } });
        const updated = await AssetModel.find({ _id: { $in: ids } }).lean();
        void indexAssets(updated as never[]);
        return NextResponse.json({ ok: true, affected: ids.length });
      }

      case "remove-tags": {
        const tags = data?.tags ?? [];
        if (tags.length === 0) return NextResponse.json({ error: "tags required" }, { status: 400 });
        await AssetModel.updateMany({ _id: { $in: ids } }, { $pull: { tags: { $in: tags } } });
        const updated = await AssetModel.find({ _id: { $in: ids } }).lean();
        void indexAssets(updated as never[]);
        return NextResponse.json({ ok: true, affected: ids.length });
      }

      case "favorite":
        await AssetModel.updateMany({ _id: { $in: ids } }, { isFavorite: true });
        return NextResponse.json({ ok: true, affected: ids.length });

      case "unfavorite":
        await AssetModel.updateMany({ _id: { $in: ids } }, { isFavorite: false });
        return NextResponse.json({ ok: true, affected: ids.length });

      default:
        return NextResponse.json({ error: `Unknown operation: ${operation}` }, { status: 400 });
    }
  } catch (err) {
    console.error("[POST /api/assets/bulk]", err);
    return NextResponse.json({ error: "Bulk operation failed" }, { status: 500 });
  }
}
