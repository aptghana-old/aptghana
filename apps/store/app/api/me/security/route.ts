import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel, recordAudit } from "@apt/db";

/** Login history + session info for the security page. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id)
      .select("+loginHistory lastLoginAt sessionVersion")
      .lean<{
        loginHistory?: { at: Date; ip?: string; userAgent?: string }[];
        lastLoginAt?: Date;
      }>();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({
      lastLoginAt: user.lastLoginAt ?? null,
      // Most recent first
      loginHistory: [...(user.loginHistory ?? [])].reverse().map((e) => ({
        at: e.at,
        ip: e.ip ?? "",
        userAgent: e.userAgent ?? "",
      })),
    });
  } catch (err) {
    console.error("[me security GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * Sign out everywhere: bumping sessionVersion invalidates every issued JWT
 * (including this one) within the 5-minute re-validation window.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (body.action !== "signout-all") {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  try {
    await connectDB();
    await UserModel.findByIdAndUpdate(session.user.id, { $inc: { sessionVersion: 1 } });
    await recordAudit({
      entityType: "user",
      entityId: session.user.id,
      action: "sessions_revoked",
      actor: { type: "customer", id: session.user.id, name: session.user.email ?? undefined },
      message: "All sessions signed out from the security page",
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[me security POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
