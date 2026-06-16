import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

const VALID_STATUSES = ["active", "inactive", "suspended", "pending"];

export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: "A valid status is required" }, { status: 400 });
  }

  try {
    const session = await auth();
    await connectDB();
    const customer = await UserModel.findById(id);
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const from = customer.status;
    if (from === body.status) return NextResponse.json({ ok: true, status: from });

    customer.status = body.status as typeof customer.status;
    await customer.save();

    await recordAudit({
      entityType: "user",
      entityId: customer._id,
      action: "status_changed",
      fromStatus: from,
      toStatus: body.status,
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
    });

    return NextResponse.json({ ok: true, status: body.status });
  } catch (err) {
    console.error("POST /api/customers/[id]/status", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
