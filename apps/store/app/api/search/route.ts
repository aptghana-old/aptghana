import { NextRequest, NextResponse } from "next/server";
import { searchProducts } from "@apt/search";
import { createRateLimiter, getClientIp } from "@apt/auth";

// M-05: Rate limit search endpoint — 60 requests per IP per minute
const limiter = createRateLimiter(60, 60 * 1000);

export async function GET(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const q        = searchParams.get("q") ?? "";
  const page     = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit    = Math.min(48, Math.max(1, parseInt(searchParams.get("limit") ?? "24", 10)));
  const brand    = searchParams.get("brand") ?? undefined;
  const category = searchParams.get("category") ?? undefined;

  if (!q.trim()) {
    return NextResponse.json({ hits: [], totalHits: 0, page: 1, totalPages: 0, processingTimeMs: 0, query: "" });
  }

  try {
    const result = await searchProducts(
      q.slice(0, 200), // cap query length
      { brands: brand ? [brand] : undefined, categories: category ? [category] : undefined },
      page,
      limit,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" },
    });
  } catch {
    return NextResponse.json({ error: "Search unavailable" }, { status: 503 });
  }
}
