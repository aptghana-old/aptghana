import { NextRequest, NextResponse } from "next/server";
import { connectDB, AnalyticsModel } from "@apt/db";
import { SITE_DOMAIN } from "@apt/config";
import { createRateLimiter, getClientIp } from "@apt/auth";

export const runtime = "nodejs";

const limiter = createRateLimiter(120, 60 * 1000); // 120 per minute per IP

const VALID_TYPES = new Set([
  "pageview", "product_view", "search", "add_to_cart",
  "rfq_submit", "order_complete", "brand_view",
  "category_view", "document_download", "click",
]);

function device(ua: string): "desktop" | "mobile" | "tablet" {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobile|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function browser(ua: string): string {
  if (/edg\//i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

function os(ua: string): string {
  if (/windows/i.test(ua)) return "Windows";
  if (/macintosh|mac os x/i.test(ua)) return "macOS";
  if (/iphone|ipad/i.test(ua)) return "iOS";
  if (/android/i.test(ua)) return "Android";
  if (/linux/i.test(ua)) return "Linux";
  return "Other";
}

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) return new NextResponse(null, { status: 204 }); // silent drop

  try {
    const body = await req.json().catch(() => null);
    if (!body?.events || !Array.isArray(body.events) || body.events.length === 0) {
      return new NextResponse(null, { status: 204 });
    }

    const ua = req.headers.get("user-agent") ?? "";
    const country = req.headers.get("x-vercel-ip-country") ?? undefined;
    const hostname = req.headers.get("host")?.split(":")[0] ?? SITE_DOMAIN;

    const enriched = {
      country,
      hostname,
      device: device(ua),
      browser: browser(ua),
      os: os(ua),
    };

    type RawEvent = {
      eventType?: unknown;
      path?: unknown;
      sessionId?: unknown;
      referrer?: unknown;
      occurredAt?: unknown;
      properties?: Record<string, unknown>;
    };

    const docs = (body.events as RawEvent[])
      .slice(0, 50)
      .filter((e) =>
        e &&
        typeof e.eventType === "string" && VALID_TYPES.has(e.eventType) &&
        typeof e.path === "string" &&
        typeof e.sessionId === "string"
      )
      .map((e) => {
        const props = e.properties ?? {};
        return {
          ...enriched,
          sessionId: String(e.sessionId).slice(0, 64),
          eventType: e.eventType as string,
          path: String(e.path).slice(0, 512),
          referrer: e.referrer ? String(e.referrer).slice(0, 512) : undefined,
          utm: {
            source: props.utm_source as string | undefined,
            medium: props.utm_medium as string | undefined,
            campaign: props.utm_campaign as string | undefined,
            term: props.utm_term as string | undefined,
            content: props.utm_content as string | undefined,
          },
          properties: props,
          createdAt: e.occurredAt ? new Date(String(e.occurredAt)) : new Date(),
        };
      });

    if (docs.length > 0) {
      await connectDB();
      await AnalyticsModel.insertMany(docs, { ordered: false });
    }
  } catch {
    // Analytics must never surface errors to the visitor
  }

  return new NextResponse(null, { status: 204 });
}
