import { connectDB, CategoryModel } from "@apt/db";

export type CategoryLevel = "group" | "category" | "subcategory" | "range";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  level: CategoryLevel;
  productCount?: number;
  hasChildren?: boolean;
}

export interface CategoryChain {
  group?: CategoryNode;
  category?: CategoryNode;
  subcategory?: CategoryNode;
  range?: CategoryNode;
  /** Root-to-leaf order. */
  chain: CategoryNode[];
  path: string;
  url: string;
}

const LEVEL_ORDER: CategoryLevel[] = ["group", "category", "subcategory", "range"];
const CHILD_LEVEL: Record<CategoryLevel, CategoryLevel | null> = {
  group: "category",
  category: "subcategory",
  subcategory: "range",
  range: null,
};

interface RawCategory {
  _id: { toString(): string };
  name: string;
  slug: string;
  level: CategoryLevel;
  productCount?: number;
}

function toNode(c: RawCategory): CategoryNode {
  return { id: c._id.toString(), name: c.name, slug: c.slug, level: c.level, productCount: c.productCount };
}

/** Root groups (no parent) when parentId is omitted, otherwise direct children of parentId. */
export async function getCategoryChildren(parentId?: string): Promise<CategoryNode[]> {
  await connectDB();
  const query = parentId
    ? { parentId, status: "active" }
    : { level: "group" as const, parentId: { $exists: false }, status: "active" };

  const docs = await CategoryModel.find(query)
    .select("_id name slug level productCount")
    .sort({ displayOrder: 1, name: 1 })
    .lean<RawCategory[]>();

  if (docs.length === 0) return [];

  // Cheap "has children" probe for the tree browser's expand affordance.
  const childLevel = CHILD_LEVEL[docs[0].level];
  if (!childLevel) return docs.map(toNode);

  const ids = docs.map((d) => d._id.toString());
  const withChildren = await CategoryModel.distinct("parentId", { parentId: { $in: ids }, status: "active" });
  const hasChildSet = new Set(withChildren.map((id: unknown) => String(id)));

  return docs.map((d) => ({ ...toNode(d), hasChildren: hasChildSet.has(d._id.toString()) }));
}

export interface CategorySearchResult extends CategoryNode {
  breadcrumb: { name: string; slug: string }[];
}

/** Typeahead search across all hierarchy levels, with breadcrumb context for each hit. */
export async function searchCategories(q: string, limit = 20): Promise<CategorySearchResult[]> {
  await connectDB();
  const safe = q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (!safe) return [];

  const docs = await CategoryModel.find({ name: { $regex: safe, $options: "i" }, status: "active" })
    .select("_id name slug level ancestors")
    .limit(limit)
    .populate({ path: "ancestors", select: "name slug" })
    .lean<(RawCategory & { ancestors?: { name: string; slug: string }[] })[]>();

  return docs.map((d) => ({
    ...toNode(d),
    breadcrumb: (d.ancestors ?? []).map((a) => ({ name: a.name, slug: a.slug })),
  }));
}

/** Resolves a leaf category id into its full Group→Range chain, path, and catalogue URL. */
export async function resolveCategoryChain(leafId: string): Promise<CategoryChain | null> {
  await connectDB();
  const leaf = await CategoryModel.findOne({ _id: leafId, status: "active" })
    .select("_id name slug level ancestors")
    .populate({ path: "ancestors", select: "name slug level" })
    .lean<RawCategory & { ancestors?: RawCategory[] }>();
  if (!leaf) return null;

  const chain: CategoryNode[] = [...(leaf.ancestors ?? []).map(toNode), toNode(leaf)]
    .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

  const result: CategoryChain = {
    chain,
    path: chain.map((c) => c.slug).join("/"),
    url: "/catalog/" + chain.map((c) => c.slug).join("/"),
  };
  for (const node of chain) {
    if (node.level === "group") result.group = node;
    if (node.level === "category") result.category = node;
    if (node.level === "subcategory") result.subcategory = node;
    if (node.level === "range") result.range = node;
  }
  return result;
}

/** Embedded `categories` shape stored on a Product document. */
export function buildEmbeddedCategories(chain: CategoryNode[]): { id: string; name: string; slug: string; level: CategoryLevel }[] {
  return chain.map((c) => ({ id: c.id, name: c.name, slug: c.slug, level: c.level }));
}
