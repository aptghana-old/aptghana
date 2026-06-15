import { NextRequest, NextResponse } from "next/server";
import { getAutocompleteSuggestions } from "@apt/search";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(60, 60 * 1000);

export async function GET(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) return NextResponse.json({ products: [], brands: [], categories: [] }, { status: 429 });
  const q = req.nextUrl.searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return NextResponse.json({ products: [], brands: [], categories: [] });
  }

  try {
    const result = await getAutocompleteSuggestions(q.trim(), 6);
    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120" },
    });
  } catch {
    return NextResponse.json({ products: [], brands: [], categories: [] });
  }
}
