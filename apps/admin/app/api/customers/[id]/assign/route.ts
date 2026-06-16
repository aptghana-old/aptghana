import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, AdminModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

/** Assign (or clear) the sales rep responsible for a customer account. */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  const { id } = await params;
  let body: { salesRepId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    const session = await auth();
    await connectDB();

    let rep: { _id: unknown; name: string } | null = null;
    if (body.salesRepId) {
      rep = await AdminModel.findById(body.salesRepId).select("name").lean<{ _id: unknown; name: string }>();
      if (!rep) return NextResponse.json({ error: "Sales rep not found" }, { status: 404 });
    }

    const customer = await UserModel.findByIdAndUpdate(
      id,
      {
        $set: {
          assignedSalesRep: rep?._id ?? undefined,
          assignedSalesRepName: rep?.name ?? undefined,
        },
      },
      { new: true, select: "assignedSalesRep assignedSalesRepName" }
    ).lean<{ assignedSalesRepName?: string }>();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    await recordAudit({
      entityType: "user",
      entityId: id,
      action: "sales_rep_assigned",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: rep ? `Assigned to ${rep.name}` : "Unassigned",
    });

    return NextResponse.json({ ok: true, assignedSalesRepName: customer.assignedSalesRepName ?? null });
  } catch (err) {
    console.error("POST /api/customers/[id]/assign", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
