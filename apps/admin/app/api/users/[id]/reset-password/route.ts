import { NextRequest, NextResponse } from "next/server";
import { connectDB, AdminModel, recordAudit } from "@apt/db";
import { hashPassword, generateToken, hashToken } from "@apt/auth";
import { requirePermission, requireFreshSession } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import crypto from "crypto";

/** POST /api/users/[id]/reset-password — generate a password reset link */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denyPerm = await requirePermission("users:edit");
  if (denyPerm) return denyPerm;

  const denyFresh = await requireFreshSession();
  if (denyFresh) return denyFresh;

  try {
    const session = await auth();
    const actor = session!.user as { id: string; name: string; role: string };
    const { id } = await params;

    if (id === actor.id && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Use the profile settings to change your own password" }, { status: 400 });
    }

    await connectDB();
    const target = await AdminModel.findOne({
      _id: id,
      deletedAt: { $exists: false },
    }).lean<{ role: string; name: string; email: string }>();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const body = await req.json().catch(() => ({})) as { forceChange?: boolean };
    const forceChange = body.forceChange !== false;

    // Generate new temp password + reset token
    const tempPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await hashPassword(tempPassword);
    const resetToken = generateToken(32);
    const passwordResetToken = hashToken(resetToken);
    const passwordResetExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    await AdminModel.findByIdAndUpdate(id, {
      $set: {
        passwordHash,
        passwordResetToken,
        passwordResetExpiry,
        mustChangePassword: forceChange,
        failedLoginAttempts: 0,
        updatedBy: actor.id,
      },
      $unset: { lockedUntil: "" },
    });

    await recordAudit({
      entityType: "admin",
      entityId: id,
      action: "admin_password_reset",
      actor: { type: "sales", id: actor.id, name: actor.name },
      message: `Password reset by ${actor.name}`,
      meta: { forceChange },
    });

    return NextResponse.json({ resetToken });
  } catch (err) {
    console.error("POST /api/users/[id]/reset-password", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
