import { NextResponse } from "next/server";
import { connectDB, AssetModel } from "@apt/db";
import { requireAdmin } from "@/lib/auth/require";

export interface FolderNode {
  path:     string;
  name:     string;
  count:    number;
  bytes:    number;
  children: FolderNode[];
}

export async function GET() {
  const deny = await requireAdmin();
  if (deny) return deny;
  try {
    await connectDB();

    const rows = await AssetModel.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id:   "$folder",
          count: { $sum: 1 },
          bytes: { $sum: "$size" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build tree from flat paths
    const tree = buildTree(rows.map((r: { _id: string; count: number; bytes: number }) => ({
      path:  r._id,
      count: r.count,
      bytes: r.bytes,
    })));

    return NextResponse.json({ ok: true, folders: tree });
  } catch (err) {
    console.error("[GET /api/assets/folders]", err);
    return NextResponse.json({ error: "Failed to load folders" }, { status: 500 });
  }
}

function buildTree(items: { path: string; count: number; bytes: number }[]): FolderNode[] {
  const nodeMap = new Map<string, FolderNode>();

  // First pass: create all nodes
  for (const item of items) {
    nodeMap.set(item.path, {
      path:     item.path,
      name:     item.path.split("/").pop() ?? item.path,
      count:    item.count,
      bytes:    item.bytes,
      children: [],
    });
  }

  // Ensure parent nodes exist (even if they have no direct assets)
  for (const item of items) {
    const parts = item.path.split("/");
    for (let i = 1; i < parts.length; i++) {
      const parentPath = parts.slice(0, i).join("/");
      if (!nodeMap.has(parentPath)) {
        nodeMap.set(parentPath, {
          path:     parentPath,
          name:     parts[i - 1],
          count:    0,
          bytes:    0,
          children: [],
        });
      }
    }
  }

  // Second pass: build hierarchy
  const roots: FolderNode[] = [];
  for (const [path, node] of nodeMap) {
    const lastSlash = path.lastIndexOf("/");
    if (lastSlash === -1) {
      roots.push(node);
    } else {
      const parentPath = path.slice(0, lastSlash);
      const parent     = nodeMap.get(parentPath);
      if (parent) {
        parent.children.push(node);
        parent.count += node.count;
        parent.bytes += node.bytes;
      } else {
        roots.push(node);
      }
    }
  }

  return roots.sort((a, b) => a.name.localeCompare(b.name));
}
