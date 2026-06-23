import { NextRequest, NextResponse } from "next/server";
import { connectDB, AdminModel, recordAudit } from "@apt/db";
import { hashPassword, generateToken, hashToken } from "@apt/auth";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const ROLE_HIERARCHY: Record<string, number> = {
  super_admin: 4,
  manager: 3,
  sales: 2,
  account: 1,
};

function canActorManageRole(actorRole: string, targetRole: string): boolean {
  if (actorRole === "super_admin") return true;
  return (ROLE_HIERARCHY[actorRole] ?? 0) > (ROLE_HIERARCHY[targetRole] ?? 0);
}

/** GET /api/users — list admin users */
export async function GET(req: NextRequest) {
  const deny = await requirePermission("users:view");
  if (deny) return deny;

  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const role = searchParams.get("role");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const query: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (role && role !== "all") query.role = role;
    if (status && status !== "all") query.status = status;
    if (search?.trim()) {
      const re = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      query.$or = [{ name: re }, { email: re }, { username: re }];
    }

    const admins = await AdminModel.find(query)
      .sort({ role: 1, name: 1 })
      .select("-passwordHash -mfaSecret -passwordResetToken -passwordResetExpiry")
      .lean();

    return NextResponse.json({ admins });
  } catch (err) {
    console.error("GET /api/users", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/** POST /api/users — create/invite an admin user */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("users:create");
  if (deny) return deny;

  try {
    const session = await auth();
    const actor = session!.user as { id: string; name: string; role: string };

    const body = await req.json();
    const { name, email, username, role, permissions = [] } = body as {
      name: string;
      email: string;
      username: string;
      role: string;
      permissions?: string[];
    };

    if (!name?.trim() || !email?.trim() || !username?.trim() || !role) {
      return NextResponse.json({ error: "name, email, username, and role are required" }, { status: 422 });
    }

    if (!canActorManageRole(actor.role, role)) {
      return NextResponse.json(
        { error: "You cannot assign a role equal to or above your own" },
        { status: 403 },
      );
    }

    await connectDB();

    const existing = await AdminModel.findOne({
      $or: [
        { email: email.trim().toLowerCase() },
        { username: username.trim().toLowerCase() },
      ],
      deletedAt: { $exists: false },
    }).lean();

    if (existing) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    // Temporary password with a mandatory reset token
    const tempPassword = crypto.randomBytes(24).toString("hex");
    const passwordHash = await hashPassword(tempPassword);
    const resetToken = generateToken(32);
    const passwordResetToken = hashToken(resetToken);
    const passwordResetExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const admin = await AdminModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      username: username.trim().toLowerCase(),
      passwordHash,
      role,
      permissions,
      status: "active",
      mustChangePassword: true,
      passwordResetToken,
      passwordResetExpiry,
      createdBy: actor.id,
    });

    await recordAudit({
      entityType: "admin",
      entityId: admin._id,
      action: "admin_user_created",
      actor: { type: "sales", id: actor.id, name: actor.name },
      message: `Created by ${actor.name}`,
      meta: { role, email: email.trim().toLowerCase() },
    });

    return NextResponse.json(
      { id: admin._id.toString(), resetToken },
      { status: 201 },
    );
  } catch (err) {
    console.error("POST /api/users", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
