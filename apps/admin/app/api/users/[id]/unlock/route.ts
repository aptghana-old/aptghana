import { NextRequest, NextResponse } from "next/server";
import { connectDB, AdminModel, recordAudit } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

/** POST /api/users/[id]/unlock — unlock a locked account or toggle active/suspended */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requirePermission("users:edit");
  if (deny) return deny;

  try {
    const session = await auth();
    const actor = session!.user as { id: string; name: string; role: string };
    const { id } = await params;

    const body = await req.json().catch(() => ({})) as { action?: "unlock" | "activate" | "suspend" };
    const action = body.action ?? "unlock";

    await connectDB();
    const target = await AdminModel.findOne({
      _id: id,
      deletedAt: { $exists: false },
    }).lean<{ role: string; name: string; status: string }>();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (target.role === "super_admin" && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Cannot modify a super admin account" }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updatedBy: actor.id };
    let auditAction = "";
    let message = "";

    if (action === "unlock") {
      updates.failedLoginAttempts = 0;
      updates.$unset = { lockedUntil: "" };
      auditAction = "admin_account_unlocked";
      message = `Account unlocked by ${actor.name}`;
    } else if (action === "activate") {
      updates.status = "active";
      auditAction = "admin_user_activated";
      message = `Account activated by ${actor.name}`;
    } else if (action === "suspend") {
      if (id === actor.id) {
        return NextResponse.json({ error: "Cannot suspend your own account" }, { status: 400 });
      }
      updates.status = "suspended";
      auditAction = "admin_user_suspended";
      message = `Account suspended by ${actor.name}`;
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 422 });
    }

    const { $unset, ...setUpdates } = updates;
    await AdminModel.findByIdAndUpdate(id, {
      $set: setUpdates,
      ...($unset ? { $unset } : {}),
    });

    await recordAudit({
      entityType: "admin",
      entityId: id,
      action: auditAction,
      actor: { type: "sales", id: actor.id, name: actor.name },
      message,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/users/[id]/unlock", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
