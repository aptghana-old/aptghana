import type { Metadata } from "next";
import { connectDB, CategoryModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { auth } from "@/lib/auth";
import { getLiveProductCounts } from "@/lib/categoryHierarchy";
import CategoryTree, { type TreeNode } from "@/components/categories/CategoryTree";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

interface RawCategory {
  _id: { toString(): string };
  name: string;
  slug: string;
  level: string;
  status: string;
  displayOrder: number;
}

async function getRootNodes(): Promise<TreeNode[]> {
  try {
    await connectDB();
    const roots = await CategoryModel.find({ parentId: { $exists: false } })
      .select("name slug level status displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean<RawCategory[]>();

    const ids = roots.map((c) => c._id.toString());
    const [counts, childCountRows] = await Promise.all([
      getLiveProductCounts(ids),
      CategoryModel.aggregate<{ _id: string; count: number }>([
        { $match: { parentId: { $in: roots.map((c) => c._id) } } },
        { $group: { _id: { $toString: "$parentId" }, count: { $sum: 1 } } },
      ]),
    ]);
    const childCountMap = new Map(childCountRows.map((r) => [r._id, r.count]));

    return roots.map((c) => ({
      id: c._id.toString(), name: c.name, slug: c.slug, level: c.level, status: c.status,
      displayOrder: c.displayOrder, productCount: counts.get(c._id.toString()) ?? 0,
      hasChildren: (childCountMap.get(c._id.toString()) ?? 0) > 0,
    }));
  } catch (err) {
    console.error("[categories tree]", err);
    return [];
  }
}

async function getTotalCount(): Promise<number> {
  try {
    await connectDB();
    return await CategoryModel.countDocuments();
  } catch {
    return 0;
  }
}

export default async function CategoriesPage() {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "categories:edit") || hasPermission(role, overrides, "categories:create");
  const canDelete = hasPermission(role, overrides, "categories:delete");

  const [rootNodes, total] = await Promise.all([getRootNodes(), getTotalCount()]);

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${total.toLocaleString()} categor${total !== 1 ? "ies" : "y"} across the Group → Category → Subcategory → Range taxonomy`}
      />
      <CategoryTree rootNodes={rootNodes} canEdit={canEdit} canDelete={canDelete} />
    </div>
  );
}
