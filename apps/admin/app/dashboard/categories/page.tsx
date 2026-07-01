import type { Metadata } from "next";
import { connectDB, CategoryModel, ProductModel } from "@apt/db";
import { hasPermission, type AdminRole } from "@apt/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { auth } from "@/lib/auth";
import { getLiveProductCounts, LEVELS } from "@/lib/categoryHierarchy";
import { LEVEL_LABEL, LEVEL_DOT } from "@/lib/categoryLevels";
import { Panel, StatCard, BarList } from "@/components/analytics/primitives";
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

async function getStats() {
  try {
    await connectDB();
    const [total, active, levelCounts, productsClassified] = await Promise.all([
      CategoryModel.countDocuments(),
      CategoryModel.countDocuments({ status: "active" }),
      CategoryModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: "$level", count: { $sum: 1 } } },
      ]),
      ProductModel.countDocuments({ "categories.0": { $exists: true } }),
    ]);
    return { total, active, levelCounts, productsClassified };
  } catch {
    return { total: 0, active: 0, levelCounts: [] as { _id: string; count: number }[], productsClassified: 0 };
  }
}

export default async function CategoriesPage() {
  const session = await auth();
  const role = (session?.user as { role?: AdminRole } | undefined)?.role ?? "sales";
  const overrides = (session?.user as { permissions?: string[] } | undefined)?.permissions ?? [];
  const canEdit = hasPermission(role, overrides, "categories:edit") || hasPermission(role, overrides, "categories:create");
  const canDelete = hasPermission(role, overrides, "categories:delete");

  const [rootNodes, stats] = await Promise.all([getRootNodes(), getStats()]);
  const { total, active, levelCounts, productsClassified } = stats;
  const levelCountMap = new Map(levelCounts.map((l) => [l._id, l.count]));

  const topGroups = [...rootNodes].sort((a, b) => b.productCount - a.productCount);

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${rootNodes.length} group${rootNodes.length !== 1 ? "s" : ""} · ${(levelCountMap.get("category") ?? 0).toLocaleString()} categories · ${productsClassified.toLocaleString()} products classified across the Group → Category → Subcategory → Range taxonomy`}
      />

      <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 space-y-4">
        {/* KPI strip */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Categories" value={total.toLocaleString()} accent="#3D4CD6" />
          <StatCard label="Top-level Groups" value={rootNodes.length.toLocaleString()} accent="#0BA5A5" />
          <StatCard label="Active" value={active.toLocaleString()} accent="#00B37E" />
          <StatCard label="Products Classified" value={productsClassified.toLocaleString()} accent="#F5820A" />
        </div>

        {/* Tree + rail */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2">
            <CategoryTree rootNodes={rootNodes} canEdit={canEdit} canDelete={canDelete} />
          </div>

          <div className="flex flex-col gap-4">
            <Panel title="Top groups by products">
              <BarList
                accent="#3D4CD6"
                items={topGroups.map((g) => ({ label: g.name, value: g.productCount }))}
              />
            </Panel>

            <Panel title="Taxonomy levels">
              <div className="flex flex-col gap-3">
                {LEVELS.map((lvl, i) => (
                  <div key={lvl} className="flex items-center gap-2.5">
                    <span
                      className="rounded-lg flex items-center justify-center shrink-0 text-[11px] font-extrabold"
                      style={{ width: 26, height: 26, background: `${LEVEL_DOT[lvl]}1F`, color: LEVEL_DOT[lvl] }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[12.5px] font-semibold flex-1" style={{ color: "var(--apt-text-secondary)" }}>
                      {LEVEL_LABEL[lvl]}
                    </span>
                    <span className="font-mono text-xs" style={{ color: "var(--apt-text-primary)" }}>
                      {(levelCountMap.get(lvl) ?? 0).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}
