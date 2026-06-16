import { NextRequest, NextResponse } from "next/server";
import { connectDB, OrderModel, QuoteModel, recordAudit, canTransition } from "@apt/db";
import { QUOTE_STATUS_LABELS, type QuoteStatus } from "@apt/types";
import { requirePermission } from "@/lib/auth/require";

/** Quote workflow statuses → linked Order statuses (Order has a narrower enum). */
const ORDER_STATUS_SYNC: Partial<Record<QuoteStatus, string>> = {
  processing:         "processing",
  ready_for_delivery: "processing",
  shipped:            "shipped",
  delivered:          "delivered",
  completed:          "delivered",
  cancelled:          "cancelled",
};

interface Params { params: Promise<{ id: string }> }

/**
 * Generic workflow transition for fulfilment and admin statuses
 * (paid → processing → ready_for_delivery → shipped → delivered → completed,
 * plus cancel/expire). Approval and payment have dedicated endpoints and are
 * not reachable through here.
 */
const BLOCKED_TARGETS: QuoteStatus[] = ["approved", "paid"];

export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission('quotes:edit');
  if (deny) return deny;
  const { id } = await params;

  let body: { status?: string; note?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const target = body.status as QuoteStatus | undefined;
  if (!target || !(target in QUOTE_STATUS_LABELS)) {
    return NextResponse.json({ error: "A valid target status is required" }, { status: 400 });
  }
  if (BLOCKED_TARGETS.includes(target)) {
    return NextResponse.json(
      { error: `"${target}" is set by its dedicated workflow action, not manually.` },
      { status: 400 },
    );
  }

  try {
    await connectDB();
    const quote = await QuoteModel.findById(id);
    if (!quote) return NextResponse.json({ error: "Quote not found" }, { status: 404 });

    const from = quote.status as QuoteStatus;
    if (from === target) return NextResponse.json({ ok: true, status: from }); // idempotent

    if (!canTransition(from, target)) {
      return NextResponse.json(
        { error: `Invalid transition: ${QUOTE_STATUS_LABELS[from]} → ${QUOTE_STATUS_LABELS[target]}` },
        { status: 409 },
      );
    }

    quote.status = target;
    await quote.save();

    // Keep the linked order in step with the quote workflow
    const orderStatus = ORDER_STATUS_SYNC[target];
    if (quote.orderId && orderStatus) {
      await OrderModel.updateOne({ _id: quote.orderId }, { $set: { status: orderStatus } });
    }

    await recordAudit({
      entityType: "quote",
      entityId: quote._id,
      ref: quote.quoteNumber || quote.ref,
      action: "status_changed",
      fromStatus: from,
      toStatus: target,
      actor: { type: "sales", name: "Sales" },
      message: body.note ? String(body.note).slice(0, 1000) : undefined,
    });

    return NextResponse.json({ ok: true, status: target });
  } catch (err) {
    console.error("[admin quotes status]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
