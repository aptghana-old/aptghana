import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel } from "@apt/db";
import { generateToken, hashToken } from "@/lib/auth/helpers";
import { sendVerificationEmail } from "@/lib/auth/email";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(3, 15 * 60 * 1000); // 3 per 15 min

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    // Return neutral to not reveal rate-limiting on email existence
    return NextResponse.json(
      { message: "If a pending account exists, a new verification email has been sent." },
      { status: 200 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    await connectDB();
    const user = await UserModel.findOne({
      email: email.toLowerCase().trim(),
      emailVerified: false,
    });

    const neutral = { message: "If a pending account exists, a new verification email has been sent." };
    if (!user) return NextResponse.json(neutral);

    const rawToken = generateToken();
    await UserModel.findByIdAndUpdate(user._id, {
      emailVerifyToken:   hashToken(rawToken),
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    await sendVerificationEmail(email, rawToken, (user as { name: string }).name);

    return NextResponse.json(neutral);
  } catch {
    // L-10: Return the same neutral message on server error to prevent probing
    console.error("[resend-verification] handler error");
    return NextResponse.json(
      { message: "If a pending account exists, a new verification email has been sent." },
      { status: 200 },
    );
  }
}
