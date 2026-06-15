import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel } from "@apt/db";
import { sendPasswordResetEmail } from "@/lib/auth/email";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(3, 15 * 60 * 1000); // 3 per 15 min

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    return NextResponse.json(
      { message: "If an account exists with that email, a reset link has been sent." },
      { status: 200 } // neutral — don't reveal rate limit via 429
    );
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    await connectDB();
    const user = await UserModel.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 to prevent email enumeration
    const neutral = { message: "If an account exists with that email, a reset link has been sent." };

    if (!user) return NextResponse.json(neutral);

    const rawToken = (user as unknown as { createPasswordResetToken: () => string }).createPasswordResetToken();
    await (user as { save: () => Promise<void> }).save();

    await sendPasswordResetEmail(email, rawToken, (user as { name: string }).name);

    return NextResponse.json(neutral);
  } catch (err) {
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
