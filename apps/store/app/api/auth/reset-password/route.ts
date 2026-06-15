import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { connectDB, UserModel } from "@apt/db";
import { hashPassword, isPasswordValid } from "@/lib/auth/helpers";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(5, 15 * 60 * 1000); // 5 per 15 min

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ error: "Token and new password are required." }, { status: 400 });
    }
    if (!isPasswordValid(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with uppercase, lowercase, and a number." },
        { status: 400 },
      );
    }

    await connectDB();
    const hashed = crypto.createHash("sha256").update(token).digest("hex");

    const user = await UserModel.findOne({
      passwordResetToken:   hashed,
      passwordResetExpires: { $gt: new Date() },
    }).select("+passwordHash");

    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid or has expired. Please request a new one." },
        { status: 400 },
      );
    }

    const newHash = await hashPassword(password);

    // Invalidate all existing sessions by incrementing sessionVersion (M-02 pattern)
    await UserModel.findByIdAndUpdate(user._id, {
      $set:   { passwordHash: newHash },
      $unset: { passwordResetToken: 1, passwordResetExpires: 1 },
      $inc:   { sessionVersion: 1 },
    });

    return NextResponse.json({ message: "Password updated successfully. You can now sign in." });
  } catch {
    // L-10: Do not leak server error details
    console.error("[reset-password] handler error");
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
