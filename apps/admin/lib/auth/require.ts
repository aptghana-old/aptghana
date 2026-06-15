import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Returns a 401 Response if no valid admin session exists, otherwise null. */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

/** Returns a 403 Response if the admin lacks the required role. */
export async function requireRole(
  ...roles: string[]
): Promise<NextResponse | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (session.user as any).role as string | undefined;
  if (userRole !== "super_admin" && !roles.includes(userRole ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
