import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel, recordAudit } from "@apt/db";

/**
 * Close the account (referenced by the settings page). Soft delete: the
 * account is suspended and every session revoked; order/quote history is
 * preserved for record-keeping.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const user = await UserModel.findByIdAndUpdate(session.user.id, {
      $set: { status: "suspended" },
      $inc: { sessionVersion: 1 },
    }).select("email").lean<{ _id: unknown; email: string }>();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await recordAudit({
      entityType: "user",
      entityId: user._id,
      action: "account_closed",
      actor: { type: "customer", id: user._id, name: user.email },
      message: "Account closed by the customer (soft delete — status suspended)",
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[delete-account]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
