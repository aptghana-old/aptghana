import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, QuoteModel, generateWorkflowRef, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

/**
 * Starts a draft quotation request for a customer from their profile
 * ("Create Quote" / "Create Order" quick actions). Items are added afterwards
 * in the quote editor — orders in this system are always created by approving
 * an `approval_request` quote, so "Create Order" starts one of those.
 */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("quotes:create");
  if (deny) return deny;

  const { id } = await params;
  let body: { kind?: "rfq" | "approval_request" };
  try {
    body = await req.json();
  } catch {
    body = {};
  }
  const kind = body.kind === "approval_request" ? "approval_request" : "rfq";

  try {
    const session = await auth();
    await connectDB();
    const customer = await UserModel.findById(id).select("name email phone company addresses").lean<{
      _id: { toString(): string }; name: string; email: string; phone?: string; company?: string;
      addresses?: { line1: string; city: string; country?: string; isDefaultBilling?: boolean }[];
    }>();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const address = customer.addresses?.find((a) => a.isDefaultBilling) ?? customer.addresses?.[0];

    const quote = await QuoteModel.create({
      ref: generateWorkflowRef(kind === "approval_request" ? "RFA" : "RFQ"),
      userId: customer._id,
      kind,
      source: "custom",
      originChannel: "admin",
      client: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        company: customer.company,
        country: address?.country,
        address: address ? [address.line1, address.city].filter(Boolean).join(", ") : undefined,
      },
      items: [],
      status: "draft",
      internalNote: `Started from customer profile by ${session?.user?.name ?? "an admin"}`,
    });

    await recordAudit({
      entityType: "user",
      entityId: id,
      action: kind === "approval_request" ? "order_started" : "quote_started",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `${kind === "approval_request" ? "Order" : "Quote"} ${quote.ref} created`,
    });

    return NextResponse.json({ id: quote._id.toString(), ref: quote.ref }, { status: 201 });
  } catch (err) {
    console.error("POST /api/customers/[id]/quotes", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
