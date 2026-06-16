import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { customerUpdateSchema, parseBody } from "@apt/types";

interface Params { params: Promise<{ id: string }> }

export async function PATCH(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  try {
    const session = await auth();
    const { id } = await params;
    const parsed = parseBody(customerUpdateSchema, await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
    const body = parsed.data;

    await connectDB();
    const customer = await UserModel.findById(id);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const updates: Record<string, unknown> = {};
    const fields = [
      "name", "phone", "company", "jobTitle", "industry", "website", "taxNumber",
    ] as const;
    for (const f of fields) {
      if (body[f] !== undefined) updates[f] = typeof body[f] === "string" ? body[f].trim() || undefined : body[f];
    }
    if (body.accountType !== undefined) updates.accountType = body.accountType === "business" ? "business" : "personal";
    if (body.businessType !== undefined) updates.businessType = body.businessType || undefined;
    if (body.tags !== undefined) updates.tags = Array.isArray(body.tags) ? body.tags.filter(Boolean) : [];

    if (body.billingAddress !== undefined || body.shippingAddress !== undefined) {
      const existing = (customer.addresses ?? []).filter(
        (a: { label?: string }) => a.label !== "Billing" && a.label !== "Shipping"
      );
      const next = [...existing];
      if (body.billingAddress?.line1) {
        next.push({ ...body.billingAddress, label: "Billing", isDefaultBilling: true });
      }
      if (body.shippingAddress?.line1) {
        next.push({ ...body.shippingAddress, label: "Shipping", isDefaultShipping: true });
      }
      updates.addresses = next;
    }

    await UserModel.updateOne({ _id: id }, { $set: updates });

    await recordAudit({
      entityType: "user",
      entityId: customer._id,
      action: "customer_updated",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Profile updated by ${session?.user?.name ?? "an admin"}`,
      meta: { fields: Object.keys(updates) },
    });

    return NextResponse.json({ id });
  } catch (err) {
    console.error("PATCH /api/customers/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
