/**
 * Step-1 of sign-in: validate credentials without creating a session.
 * Returns whether 2FA is required so the UI can show the OTP input before
 * sending the final credentials to NextAuth.
 */
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB, UserModel } from "@apt/db";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(5, 15 * 60 * 1000); // 5 per 15 min

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait before trying again." }, { status: 429 });
  }

  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel
      .findOne({ email: email.toLowerCase().trim() })
      .select("+passwordHash")
      .lean<{
        passwordHash: string;
        emailVerified: boolean;
        mfaEnabled: boolean;
        status: string;
      }>();

    if (!user) {
      // Constant-time response to prevent user enumeration
      await bcrypt.hash("dummy-prevent-timing-attack", 12);
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (!user.emailVerified) {
      return NextResponse.json({ error: "EMAIL_NOT_VERIFIED" }, { status: 403 });
    }
    if (user.status === "suspended") {
      return NextResponse.json({ error: "ACCOUNT_SUSPENDED" }, { status: 403 });
    }

    return NextResponse.json({ requiresMFA: user.mfaEnabled });
  } catch (err) {
    console.error("[pre-signin]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
