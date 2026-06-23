import { NextRequest, NextResponse } from "next/server";
import { connectDB, AdminModel, recordAudit } from "@apt/db";
import { requirePermission, requireFreshSession } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

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

type AdminLean = {
  _id: unknown;
  role: string;
  name: string;
  email: string;
  status: string;
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requirePermission("users:view");
  if (deny) return deny;

  try {
    await connectDB();
    const { id } = await params;
    const admin = await AdminModel.findById(id)
      .select("-passwordHash -mfaSecret -passwordResetToken -passwordResetExpiry")
      .lean();

    if (!admin) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({ admin: { ...admin, permissions: (admin as { permissions?: string[] }).permissions ?? [] } });
  } catch (err) {
    console.error("GET /api/users/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requirePermission("users:edit");
  if (deny) return deny;

  try {
    const session = await auth();
    const actor = session!.user as { id: string; name: string; role: string };
    const { id } = await params;

    await connectDB();
    const target = await AdminModel.findOne({
      _id: id,
      deletedAt: { $exists: false },
    }).lean<AdminLean>();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!canActorManageRole(actor.role, target.role)) {
      return NextResponse.json({ error: "Insufficient privileges to modify this user" }, { status: 403 });
    }

    const body = await req.json() as {
      name?: string;
      role?: string;
      status?: string;
      permissions?: string[];
    };
    const { name, role, status, permissions } = body;

    // Role changes require super_admin
    if (role && role !== target.role) {
      if (actor.role !== "super_admin") {
        return NextResponse.json({ error: "Only super admins can change roles" }, { status: 403 });
      }
      if (!canActorManageRole(actor.role, role)) {
        return NextResponse.json({ error: "Cannot assign a role equal to or above your own" }, { status: 403 });
      }
    }

    // Permission overrides require super_admin
    if (permissions !== undefined && actor.role !== "super_admin") {
      return NextResponse.json({ error: "Only super admins can modify per-user permission overrides" }, { status: 403 });
    }

    const updates: Record<string, unknown> = { updatedBy: actor.id };
    const auditMeta: Record<string, unknown> = {};

    if (name?.trim()) updates.name = name.trim();
    if (role && role !== target.role) {
      updates.role = role;
      auditMeta.roleChange = { from: target.role, to: role };
    }
    if (status && status !== target.status) {
      updates.status = status;
      auditMeta.statusChange = { from: target.status, to: status };
    }
    if (permissions !== undefined) {
      updates.permissions = permissions;
      auditMeta.permissionsUpdated = true;
    }

    const updated = await AdminModel.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true },
    ).select("-passwordHash -mfaSecret -passwordResetToken -passwordResetExpiry");

    const action = role && role !== target.role
      ? "admin_role_changed"
      : permissions !== undefined
        ? "admin_permissions_changed"
        : "admin_user_updated";

    await recordAudit({
      entityType: "admin",
      entityId: id,
      action,
      actor: { type: "sales", id: actor.id, name: actor.name },
      message: `Updated by ${actor.name}`,
      meta: auditMeta,
    });

    return NextResponse.json({ admin: updated });
  } catch (err) {
    console.error("PATCH /api/users/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const denyPerm = await requirePermission("users:delete");
  if (denyPerm) return denyPerm;

  const denyFresh = await requireFreshSession();
  if (denyFresh) return denyFresh;

  try {
    const session = await auth();
    const actor = session!.user as { id: string; name: string; role: string };
    const { id } = await params;

    if (id === actor.id) {
      return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
    }

    await connectDB();
    const target = await AdminModel.findOne({
      _id: id,
      deletedAt: { $exists: false },
    }).lean<AdminLean>();

    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (!canActorManageRole(actor.role, target.role)) {
      return NextResponse.json({ error: "Cannot delete a user with equal or higher role" }, { status: 403 });
    }

    await AdminModel.findByIdAndUpdate(id, {
      $set: { deletedAt: new Date(), status: "suspended", updatedBy: actor.id },
    });

    await recordAudit({
      entityType: "admin",
      entityId: id,
      action: "admin_user_deleted",
      actor: { type: "sales", id: actor.id, name: actor.name },
      message: `Soft-deleted by ${actor.name}`,
      meta: { name: target.name, email: target.email },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/users/[id]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
