import { connectDB, CategoryModel, ProductModel, Types } from "@apt/db";

export type CategoryLevel = "group" | "category" | "subcategory" | "range";

export const LEVELS: CategoryLevel[] = ["group", "category", "subcategory", "range"];
export const LEVEL_INDEX: Record<CategoryLevel, number> = { group: 0, category: 1, subcategory: 2, range: 3 };
export const CHILD_LEVEL: Record<CategoryLevel, CategoryLevel | null> = {
  group: "category",
  category: "subcategory",
  subcategory: "range",
  range: null,
};

export class HierarchyError extends Error {}

interface ParentDoc {
  _id: { toString(): string };
  level: CategoryLevel;
  ancestors?: { toString(): string }[];
  path?: string;
}

export interface HierarchyFields {
  level: CategoryLevel;
  parentId?: string;
  ancestors: string[];
  path: string;
}

/**
 * Computes the level/ancestors/path a category must have given its desired
 * parent. Throws HierarchyError for any structurally invalid placement
 * (e.g. a Range directly under a Group) — this is the single choke point
 * that guarantees the tree can never become inconsistent.
 */
export async function resolveHierarchyFields(parentId: string | null | undefined, slug: string): Promise<HierarchyFields> {
  await connectDB();

  if (!parentId) {
    return { level: "group", ancestors: [], path: slug };
  }

  const parent = await CategoryModel.findById(parentId).select("level ancestors path").lean<ParentDoc>();
  if (!parent) throw new HierarchyError("Parent category not found");

  const childLevel = CHILD_LEVEL[parent.level];
  if (!childLevel) throw new HierarchyError(`A ${parent.level} cannot have children`);

  return {
    level: childLevel,
    parentId,
    ancestors: [...(parent.ancestors ?? []).map(String), parentId],
    path: `${parent.path}/${slug}`,
  };
}

/**
 * After a category's own slug/path/ancestors change (create, rename, or
 * move), every descendant's denormalized `ancestors`/`path` must be
 * recomputed too. Walks the subtree level by level (it's at most 3 deep).
 */
export async function reparentDescendants(categoryId: string): Promise<void> {
  await connectDB();
  const self = await CategoryModel.findById(categoryId).select("ancestors path").lean<ParentDoc & { path: string }>();
  if (!self) return;

  let frontier = [{ id: categoryId, ancestors: (self.ancestors ?? []).map(String).concat(categoryId), path: self.path ?? "" }];

  while (frontier.length > 0) {
    const next: typeof frontier = [];
    for (const node of frontier) {
      const children = await CategoryModel.find({ parentId: node.id }).select("_id slug").lean<{ _id: { toString(): string }; slug: string }[]>();
      for (const child of children) {
        const childId = child._id.toString();
        const path = `${node.path}/${child.slug}`;
        await CategoryModel.updateOne({ _id: childId }, { $set: { ancestors: node.ancestors, path } });
        next.push({ id: childId, ancestors: [...node.ancestors, childId], path });
      }
    }
    frontier = next;
  }
}

/**
 * `Product.categories` is declared in the schema as `[{id, name, slug, level}]`,
 * but the data actually stored (as of this writing) is a plain array of
 * Category ObjectIds — `"categories.id"` never matches anything against real
 * data. Queried here via the native driver (`.collection`) to bypass
 * Mongoose's schema-based cast, which would otherwise mangle a raw ObjectId
 * passed against a path declared as an embedded-document array.
 */
export async function getLiveProductCount(categoryId: string): Promise<number> {
  await connectDB();
  return ProductModel.collection.countDocuments({ categories: new Types.ObjectId(categoryId) });
}

export async function getLiveProductCounts(categoryIds: string[]): Promise<Map<string, number>> {
  await connectDB();
  if (categoryIds.length === 0) return new Map();
  const ids = categoryIds.map((id) => new Types.ObjectId(id));
  const rows = await ProductModel.collection.aggregate<{ _id: Types.ObjectId; count: number }>([
    { $match: { categories: { $in: ids } } },
    { $unwind: "$categories" },
    { $match: { categories: { $in: ids } } },
    { $group: { _id: "$categories", count: { $sum: 1 } } },
  ]).toArray();
  return new Map(rows.map((r) => [r._id.toString(), r.count]));
}

export interface DeletableResult { deletable: boolean; reason?: string }

export async function assertDeletable(categoryId: string): Promise<DeletableResult> {
  await connectDB();
  const [childCount, productCount] = await Promise.all([
    CategoryModel.countDocuments({ parentId: categoryId }),
    getLiveProductCount(categoryId),
  ]);
  if (childCount > 0) return { deletable: false, reason: `Has ${childCount} child categor${childCount === 1 ? "y" : "ies"} — move or delete them first` };
  if (productCount > 0) return { deletable: false, reason: `${productCount} product${productCount === 1 ? "" : "s"} are assigned to this category` };
  return { deletable: true };
}

export interface BreadcrumbNode { id: string; name: string; slug: string; level: CategoryLevel }

export async function getBreadcrumb(categoryId: string): Promise<BreadcrumbNode[]> {
  await connectDB();
  const doc = await CategoryModel.findById(categoryId)
    .select("name slug level ancestors")
    .populate({ path: "ancestors", select: "name slug level" })
    .lean<{ _id: unknown; name: string; slug: string; level: CategoryLevel; ancestors?: { _id: { toString(): string }; name: string; slug: string; level: CategoryLevel }[] }>();
  if (!doc) return [];
  const ancestors: BreadcrumbNode[] = (doc.ancestors ?? []).map((a) => ({ id: a._id.toString(), name: a.name, slug: a.slug, level: a.level }));
  return [...ancestors, { id: categoryId, name: doc.name, slug: doc.slug, level: doc.level }];
}
