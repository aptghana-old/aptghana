import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

/** Internal CRM note — staff only, never exposed to the customer portal. */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("customers:notes");
  if (deny) return deny;

  const { id } = await params;
  let body: { body?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const text = body.body?.trim();
  if (!text) return NextResponse.json({ error: "Note body is required" }, { status: 422 });

  try {
    const session = await auth();
    await connectDB();

    const note = {
      body: text.slice(0, 4000),
      authorId: session?.user?.id,
      authorName: session?.user?.name ?? "Admin",
      createdAt: new Date(),
    };

    const customer = await UserModel.findByIdAndUpdate(
      id,
      { $push: { notes: note } },
      { new: true, select: "notes" }
    ).lean<{ notes: { _id: { toString(): string }; body: string; authorName?: string; createdAt: Date }[] }>();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    await recordAudit({
      entityType: "user",
      entityId: id,
      action: "note_added",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: text.slice(0, 200),
    });

    const last = customer.notes[customer.notes.length - 1];
    return NextResponse.json({ note: { ...last, _id: last._id?.toString() } }, { status: 201 });
  } catch (err) {
    console.error("POST /api/customers/[id]/notes", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
