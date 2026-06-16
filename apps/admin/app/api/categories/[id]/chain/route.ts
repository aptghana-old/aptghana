import { NextRequest, NextResponse } from "next/server";
import { resolveCategoryChain } from "@/lib/catalogue";
import { requirePermission } from "@/lib/auth/require";

interface Params { params: Promise<{ id: string }> }

/** GET /api/categories/[id]/chain — full Group→Range chain + catalogue path for a leaf node. */
export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requirePermission("categories:view");
  if (deny) return deny;

  const { id } = await params;
  try {
    const chain = await resolveCategoryChain(id);
    if (!chain) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    return NextResponse.json(chain);
  } catch (err) {
    console.error("GET /api/categories/[id]/chain", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
