import type { Metadata } from "next";
import Link from "next/link";
import { connectDB, CategoryModel, ProductModel } from "@apt/db";
import { FolderTree, Plus, ChevronRight } from "lucide-react";
import { Badge, statusVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Categories" };

type CategoryNode = {
  _id: string;
  name: string;
  slug: string;
  depth: number;
  status: string;
  productCount: number;
  children: CategoryNode[];
};

async function getCategoryTree() {
  try {
    await connectDB();
    const cats = await CategoryModel.find({ status: { $ne: "deleted" } })
      .sort({ depth: 1, sortOrder: 1, name: 1 })
      .select("_id name slug depth parentId status sortOrder")
      .lean();

    const slugs = cats.map((c) => (c as unknown as { slug: string }).slug);
    const counts = await ProductModel.aggregate([
      { $match: { "categories.slug": { $in: slugs }, status: "active" } },
      { $unwind: "$categories" },
      { $match: { "categories.slug": { $in: slugs } } },
      { $group: { _id: "$categories.slug", count: { $sum: 1 } } },
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id, c.count]));

    type Raw = { _id: { toString(): string }; name: string; slug: string; depth: number; parentId?: string | null; status: string };
    const map = new Map<string, CategoryNode>();
    const roots: CategoryNode[] = [];

    (cats as unknown as Raw[]).forEach((c) => {
      map.set(c._id.toString(), {
        _id: c._id.toString(),
        name: c.name,
        slug: c.slug,
        depth: c.depth,
        status: c.status,
        productCount: countMap[c.slug] ?? 0,
        children: [],
      });
    });

    (cats as unknown as Raw[]).forEach((c) => {
      const node = map.get(c._id.toString())!;
      if (c.parentId) {
        const parent = map.get(c.parentId.toString());
        if (parent) parent.children.push(node);
        else roots.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  } catch {
    return [];
  }
}

function CategoryRow({ node, depth = 0 }: { node: CategoryNode; depth?: number }) {
  return (
    <>
      <tr>
        <td>
          <Link
            href={`/dashboard/categories/${node._id}`}
            className="flex items-center gap-2 group"
            style={{ paddingLeft: depth * 20 }}
          >
            {depth > 0 && (
              <ChevronRight size={12} style={{ color: "var(--apt-text-muted)", flexShrink: 0 }} />
            )}
            <FolderTree
              size={14}
              style={{ color: depth === 0 ? "var(--apt-text-brand)" : "var(--apt-text-muted)", flexShrink: 0 }}
            />
            <span
              className={`text-[13px] group-hover:text-[#0057b8] transition-colors ${depth === 0 ? "font-medium" : ""}`}
              style={{ color: "var(--apt-text-primary)" }}
            >
              {node.name}
            </span>
          </Link>
        </td>
        <td className="hidden sm:table-cell">
          <span className="font-mono text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
            {node.slug}
          </span>
        </td>
        <td>
          <span className="text-[13px] tabular-nums font-medium" style={{ color: "var(--apt-text-primary)" }}>
            {node.productCount.toLocaleString()}
          </span>
        </td>
        <td>
          <Badge variant={statusVariant(node.status)} dot>
            {node.status}
          </Badge>
        </td>
        <td className="hidden sm:table-cell">
          <span className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>
            Level {node.depth + 1}
          </span>
        </td>
        <td>
          <div className="flex items-center gap-1">
            <Link
              href={`/dashboard/categories/${node._id}/edit`}
              className="text-[12px] px-2 py-1 rounded hover:bg-[var(--apt-bg-raised)] transition-colors"
              style={{ color: "var(--apt-text-muted)" }}
            >
              Edit
            </Link>
          </div>
        </td>
      </tr>
      {node.children.map((child) => (
        <CategoryRow key={child._id} node={child} depth={depth + 1} />
      ))}
    </>
  );
}

export default async function CategoriesPage() {
  const tree = await getCategoryTree();
  const totalCount = tree.reduce(function count(acc, n): number {
    return acc + 1 + n.children.reduce(count, 0);
  }, 0);

  return (
    <div>
      <PageHeader
        title="Categories"
        description={`${totalCount} categor${totalCount !== 1 ? "ies" : "y"} in taxonomy`}
        actions={
          <Link href="/dashboard/categories/new">
            <Button variant="primary" size="sm" icon={<Plus size={13} />}>
              Add Category
            </Button>
          </Link>
        }
      />

      <div className="p-4 sm:p-6">
        {tree.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={<FolderTree size={22} />}
              title="No categories yet"
              description="Create a category hierarchy to organise your products."
              action={
                <Link href="/dashboard/categories/new">
                  <Button variant="primary" size="sm" icon={<Plus size={13} />}>
                    Add first category
                  </Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="hidden sm:table-cell">Slug</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th className="hidden sm:table-cell">Level</th>
                  <th className="w-px" />
                </tr>
              </thead>
              <tbody>
                {tree.map((root) => (
                  <CategoryRow key={root._id} node={root} depth={0} />
                ))}
              </tbody>
            </table>
            </div>{/* /overflow-x-auto */}
          </div>
        )}
      </div>
    </div>
  );
}
