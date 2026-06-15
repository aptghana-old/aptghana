import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { generateToken, hashToken } from "@/lib/auth/helpers";
import { sendVerificationEmail } from "@/lib/auth/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Start an email change. The current address stays active until the new one
 * is verified (pendingEmail flow) — a typo can never lock the account out.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { newEmail?: string; currentPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const newEmail = String(body.newEmail ?? "").trim().toLowerCase();
  const password = String(body.currentPassword ?? "");
  if (!EMAIL_RE.test(newEmail)) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  if (!password) return NextResponse.json({ error: "Your current password is required" }, { status: 400 });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("+passwordHash email name");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return NextResponse.json({ error: "Incorrect password" }, { status: 403 });

    if (newEmail === user.email) {
      return NextResponse.json({ error: "That is already your email address" }, { status: 400 });
    }
    const taken = await UserModel.exists({ email: newEmail });
    if (taken) return NextResponse.json({ error: "That email is already in use" }, { status: 409 });

    const token = generateToken();
    user.pendingEmail         = newEmail;
    user.emailVerifyToken     = hashToken(token);
    (user as Record<string, unknown>).emailVerifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 h
    await user.save();

    await sendVerificationEmail(newEmail, token, user.name, { userId: String(user._id) });

    return NextResponse.json({
      ok: true,
      pendingEmail: newEmail,
      message: `Verification link sent to ${newEmail}. Your current email stays active until it's confirmed.`,
    });
  } catch (err) {
    console.error("[me email POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Cancel a pending email change. */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    await UserModel.findByIdAndUpdate(session.user.id, {
      $unset: { pendingEmail: 1, emailVerifyToken: 1 },
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[me email DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
