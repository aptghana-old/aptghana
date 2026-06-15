import { NextRequest, NextResponse } from "next/server";
import {
  connectDB,
  QuoteModel,
  recordAudit,
  computeQuoteTotals,
  EDITABLE_STATUSES,
  canTransition,
} from "@apt/db";
import type { QuoteStatus } from "@apt/types";
import { requireAdmin } from "@/lib/auth/require";

interface Params { params: Promise<{ id: string }> }

function num(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

function str(v: unknown, max = 1000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

export async function GET(_req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;
  try {
    await connectDB();
    const quote = await QuoteModel.findById(id).lean();
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    return NextResponse.json({ quote });
  } catch (err) {
    console.error("[admin quotes GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

interface PatchItem {
  productId?: string;
  sku?: string;
  name?: string;
  brand?: string;
  image?: string;
  quantity?: number;
  unitPrice?: number | null;
  notes?: string;
}

/**
 * Sales review edits: items (add/remove/replace/qty/price), discount, tax,
 * shipping, validity, notes. Rejected once pricing is locked (post-approval).
 */
export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requireAdmin();
  if (deny) return deny;
  const { id } = await params;

  let body: {
    items?: PatchItem[];
    discount?: number;
    taxRate?: number;
    shipping?: number;
    currency?: string;
    validityDays?: number;
    internalNote?: string;
    quoteNote?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await connectDB();
    const quote = await QuoteModel.findById(id);
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    if (quote.pricingLocked) {
      return NextResponse.json(
        { error: "Pricing is locked — this quote has been approved." },
        { status: 409 },
      );
    }
    if (!EDITABLE_STATUSES.includes(quote.status as QuoteStatus)) {
      return NextResponse.json(
        { error: `Quote in status "${quote.status}" cannot be edited.` },
        { status: 409 },
      );
    }

    if (Array.isArray(body.items)) {
      const items = body.items
        .map((i) => {
          const name = str(i.name, 300);
          const quantity = Math.max(1, Math.floor(num(i.quantity, 1)));
          const unitPrice = i.unitPrice === null || i.unitPrice === undefined
            ? undefined
            : num(i.unitPrice);
          return {
            productId: /^[a-f0-9]{24}$/i.test(str(i.productId ?? "", 24)) ? i.productId : undefined,
            sku: str(i.sku ?? "", 100) || undefined,
            name,
            brand: str(i.brand ?? "", 100) || undefined,
            image: str(i.image ?? "", 1000) || undefined,
            notes: str(i.notes ?? "", 1000) || undefined,
            quantity,
            unitPrice,
            lineTotal: unitPrice !== undefined ? Math.round(unitPrice * quantity * 100) / 100 : undefined,
            description: str(i.sku ?? "", 100) ? `${name} (${str(i.sku ?? "", 100)})` : name,
          };
        })
        .filter((i) => i.name);

      if (!items.length) {
        return NextResponse.json({ error: "A quote must contain at least one item" }, { status: 400 });
      }
      quote.items = items;
    }

    const currency = str(body.currency ?? quote.totals?.currency ?? "GHS", 5) || "GHS";

    // Always keep working totals in sync with the latest edit
    quote.totals = computeQuoteTotals({
      items: quote.items.map((i: { quantity: number; unitPrice?: number }) => i),
      discount: body.discount !== undefined ? num(body.discount) : quote.totals?.discount ?? 0,
      taxRate: body.taxRate !== undefined ? num(body.taxRate) : quote.totals?.taxRate ?? 0,
      shipping: body.shipping !== undefined ? num(body.shipping) : quote.totals?.shipping ?? 0,
      currency,
    });

    if (body.validityDays !== undefined) {
      const days = Math.max(1, Math.min(365, Math.floor(num(body.validityDays, 14)) || 14));
      quote.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }
    if (body.internalNote !== undefined) quote.internalNote = str(body.internalNote, 5000);
    if (body.quoteNote !== undefined) quote.quoteNote = str(body.quoteNote, 5000);

    // First sales touch moves Pending Review → Under Review
    const fromStatus = quote.status as QuoteStatus;
    if (fromStatus === "pending" && canTransition("pending", "reviewing")) {
      quote.status = "reviewing";
    }

    await quote.save();

    await recordAudit({
      entityType: "quote",
      entityId: quote._id,
      ref: quote.ref,
      action: "quote_edited",
      fromStatus,
      toStatus: quote.status,
      actor: { type: "sales", name: "Sales" },
      message: "Quote items/pricing updated during sales review",
      meta: { grandTotal: quote.totals?.grandTotal, itemCount: quote.items.length },
    });

    return NextResponse.json({ ok: true, quote: quote.toObject() });
  } catch (err) {
    console.error("[admin quotes PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
