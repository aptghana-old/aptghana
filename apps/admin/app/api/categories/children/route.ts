import { NextRequest, NextResponse } from "next/server";
import { getCategoryChildren } from "@/lib/catalogue";
import { requirePermission } from "@/lib/auth/require";

/** GET /api/categories/children?parentId=<id> — omit parentId for root Groups. */
export async function GET(req: NextRequest) {
  const deny = await requirePermission("categories:view");
  if (deny) return deny;

  const parentId = req.nextUrl.searchParams.get("parentId") || undefined;
  try {
    const children = await getCategoryChildren(parentId);
    return NextResponse.json({ children });
  } catch (err) {
    console.error("GET /api/categories/children", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
