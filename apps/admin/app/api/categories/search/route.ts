import { NextRequest, NextResponse } from "next/server";
import { searchCategories } from "@/lib/catalogue";
import { requirePermission } from "@/lib/auth/require";

/** GET /api/categories/search?q=acti9 — typeahead across all hierarchy levels. */
export async function GET(req: NextRequest) {
  const deny = await requirePermission("categories:view");
  if (deny) return deny;

  const q = req.nextUrl.searchParams.get("q") ?? "";
  try {
    const results = await searchCategories(q);
    return NextResponse.json({ results });
  } catch (err) {
    console.error("GET /api/categories/search", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
