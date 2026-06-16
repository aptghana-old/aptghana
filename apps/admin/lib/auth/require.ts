import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission, type AdminRole } from "@apt/auth";

/** Returns a 401 Response if no valid admin session exists, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/**
 * Returns a 403 Response if the admin lacks the required permission.
 * Respects per-user permission overrides stored on the session.
 */
export async function requirePermission(permission: Permission): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role, permissions } = session.user as { role: AdminRole; permissions: string[] };
  if (!hasPermission(role, permissions ?? [], permission)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/** Returns a 403 Response if the admin lacks the required role. */
export async function requireRole(...roles: string[]): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { role } = session.user as { role: AdminRole };
  if (role !== "super_admin" && !roles.includes(role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

/**
 * P-10: Require that the admin re-authenticated within maxAgeSeconds ago.
 * Apply to bulk deletes, user management, role changes, data exports, and
 * any operation that is hard to reverse.
 */
export async function requireFreshSession(maxAgeSeconds = 1800): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const issuedAt = (session as unknown as { iat?: number }).iat ?? 0;
  if (issuedAt && Date.now() / 1000 - issuedAt > maxAgeSeconds) {
    return NextResponse.json(
      { error: "Session expired — please sign in again to continue this operation." },
      { status: 403 },
    );
  }
  return null;
}
