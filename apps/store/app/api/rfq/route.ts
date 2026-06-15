import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { auth } from "@/lib/auth";
import {
  connectDB,
  AttachmentModel,
  QuoteModel,
  UserModel,
  generateWorkflowRef,
  recordAudit,
} from "@apt/db";
import type { QuoteAttachment, RfqSubmission } from "@apt/types";
import { sendRfqSubmittedEmails } from "@/lib/workflow/notifications";
import { createRateLimiter, getClientIp } from "@apt/auth";

// H-05: Rate limit RFQ submissions — 5 per IP per 10 minutes
const ipLimiter    = createRateLimiter(5, 10 * 60 * 1000);
// Additional per-email limiter — 3 submissions per email per hour
const emailLimiter = createRateLimiter(3, 60 * 60 * 1000);

const EMAIL_RE     = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_ITEMS    = 200;
const MAX_ATTACHMENTS = 5;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

// M-09: Allowed CDN origins for product image URLs
const ALLOWED_IMAGE_ORIGINS = [
  "assets.aptghana.com",
  "cdn.aptghana.com",
  "media.camozzi.com",
  "telemecaniquesensors.com",
];

/** M-10: Strip HTML tags from user-supplied strings to prevent stored XSS */
function stripHtml(s: string): string {
  return s.replace(/<[^>]*>/g, "").replace(/&[a-z#0-9]+;/gi, " ").trim();
}

function str(v: unknown, max = 500): string {
  return typeof v === "string" ? stripHtml(v.trim()).slice(0, max) : "";
}

/** M-09: Validate that an image URL is https:// and from a known safe CDN */
function validateImageUrl(raw: unknown): string | undefined {
  const s = str(raw, 1000);
  if (!s) return undefined;
  try {
    const url = new URL(s);
    if (url.protocol !== "https:") return undefined;
    if (!ALLOWED_IMAGE_ORIGINS.some((o) => url.hostname === o || url.hostname.endsWith(`.${o}`))) {
      return undefined;
    }
    return url.href;
  } catch {
    return undefined;
  }
}

export async function POST(req: NextRequest) {
  // H-05: Enforce per-IP rate limit before any processing
  const ip = getClientIp(req);
  const ipCheck = ipLimiter.check(ip);
  if (!ipCheck.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before submitting another enquiry." },
      { status: 429 },
    );
  }

  let body: RfqSubmission;
  try {
    body = (await req.json()) as RfqSubmission;
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const firstName = str(body.contact?.firstName, 100);
  const lastName  = str(body.contact?.lastName, 100);
  const email     = str(body.contact?.email, 200).toLowerCase();
  const phone     = str(body.contact?.phone, 50);

  if (!firstName || !lastName) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  if (!EMAIL_RE.test(email))   return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  if (!phone)                  return NextResponse.json({ error: "Phone number is required" }, { status: 400 });

  // H-05: Per-email rate limit (3 submissions per email per hour)
  const emailCheck = emailLimiter.check(`email:${email}`);
  if (!emailCheck.allowed) {
    return NextResponse.json(
      { error: "Too many submissions from this email address. Please try again later." },
      { status: 429 },
    );
  }

  const rawItems = Array.isArray(body.items) ? body.items.slice(0, MAX_ITEMS) : [];
  const items = rawItems
    .map((i) => ({
      productId: !i.custom && OBJECT_ID_RE.test(str(i.productId, 24)) ? str(i.productId, 24) : undefined,
      sku:       str(i.sku, 100) || undefined,
      name:      str(i.name, 300),
      brand:     str(i.brand, 100) || undefined,
      image:     validateImageUrl(i.imageUrl),  // M-09: sanitize image URL
      notes:     str(i.notes, 1000) || undefined,
      quantity:  Math.max(1, Math.floor(Number(i.quantity) || 1)),
      custom:    Boolean(i.custom),
    }))
    .filter((i) => i.name)
    .map((i) => ({ ...i, description: i.sku ? `${i.name} (${i.sku})` : i.name }));

  if (!items.length) {
    return NextResponse.json({ error: "At least one product is required" }, { status: 400 });
  }

  const kind = body.kind === "approval_request" ? "approval_request" : "rfq";
  const hasCustom = items.some((i) => i.custom);
  const source =
    kind === "approval_request" ? "cart"
    : hasCustom ? "custom"
    : body.source === "cart" ? "cart"
    : "single_product";

  const attachmentIds = (Array.isArray(body.attachmentIds) ? body.attachmentIds : [])
    .filter((id) => OBJECT_ID_RE.test(String(id)))
    .slice(0, MAX_ATTACHMENTS);

  try {
    const session = await auth();
    await connectDB();

    let attachments: QuoteAttachment[] = [];
    if (attachmentIds.length) {
      const docs = await AttachmentModel.find({ _id: { $in: attachmentIds }, scope: "rfq" })
        .select("name size contentType")
        .lean<{ _id: unknown; name: string; size: number; contentType: string }[]>();
      attachments = docs.map((d) => ({
        name:        d.name,
        url:         `/api/rfq/attachments/${String(d._id)}`,
        size:        d.size,
        contentType: d.contentType,
      }));
    }

    const quote = await QuoteModel.create({
      ref: generateWorkflowRef(kind === "approval_request" ? "RFA" : "RFQ"),
      userId: session?.user?.id || undefined,
      kind,
      source,
      client: {
        name:    `${firstName} ${lastName}`,
        firstName,
        lastName,
        email,
        phone,
        company: str(body.contact?.company, 200) || undefined,
        country: str(body.contact?.country, 100) || undefined,
        address: str(body.contact?.address, 500) || undefined,
      },
      items: items.map((i) => ({
        productId:   i.productId,
        sku:         i.sku,
        name:        i.name,
        brand:       i.brand,
        image:       i.image,
        notes:       i.notes,
        quantity:    i.quantity,
        description: i.description,
      })),
      attachments,
      note:          str(body.message, 5000) || undefined,
      status:        "pending",
      paymentStatus: "none",
    });

    if (attachmentIds.length) {
      await AttachmentModel.updateMany(
        { _id: { $in: attachmentIds }, scope: "rfq" },
        { $set: { quoteId: quote._id }, $unset: { expiresAt: 1 } },
      );
    }

    if (session?.user?.id) {
      await UserModel.findByIdAndUpdate(session.user.id, { $addToSet: { quoteIds: quote._id } });
    }

    await recordAudit({
      entityType: "quote",
      entityId:   quote._id,
      ref:        quote.ref,
      action:     kind === "approval_request" ? "approval_request_submitted" : "rfq_submitted",
      toStatus:   "pending",
      actor:      { type: "customer", id: session?.user?.id || undefined, name: `${firstName} ${lastName}` },
      message:    `${kind === "approval_request" ? "Request for Approval" : "RFQ"} submitted with ${items.length} line item(s) via ${source}`,
      meta:       { kind, source, itemCount: items.length, attachmentCount: attachments.length, email },
    });

    after(async () => {
      await sendRfqSubmittedEmails({
        id:     String(quote._id),
        ref:    quote.ref,
        kind,
        source,
        client: quote.client,
        items,
        note:   quote.note ?? undefined,
        userId: session?.user?.id || undefined,
      });
    });

    return NextResponse.json({ ok: true, ref: quote.ref, id: String(quote._id) }, { status: 201 });
  } catch (err) {
    console.error("[rfq POST] submission failed");
    return NextResponse.json({ error: "Failed to submit request. Please try again." }, { status: 500 });
  }
}
