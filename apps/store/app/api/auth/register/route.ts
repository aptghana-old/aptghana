import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel } from "@apt/db";
import { hashPassword, isPasswordValid, generateToken, hashToken } from "@/lib/auth/helpers";
import { sendVerificationEmail } from "@/lib/auth/email";
import { createRateLimiter, getClientIp } from "@apt/auth";

const limiter = createRateLimiter(5, 15 * 60 * 1000); // 5 per 15 min

export async function POST(req: NextRequest) {
  const { allowed } = limiter.check(getClientIp(req));
  if (!allowed) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password, name, accountType, company, jobTitle, businessType } = body;

    // Input validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: "Name, email and password are required." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    if (!isPasswordValid(password)) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters with uppercase, lowercase, and a number." },
        { status: 400 }
      );
    }

    await connectDB();

    const existing = await UserModel.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      // Don't reveal if email exists — send a neutral message
      return NextResponse.json(
        { message: "If that email is new to us, a verification link has been sent." },
        { status: 200 }
      );
    }

    const rawToken = generateToken();
    const passwordHash = await hashPassword(password);

    await UserModel.create({
      email:              email.toLowerCase().trim(),
      passwordHash,
      name:               name.trim(),
      accountType:        accountType ?? "personal",
      company:            company?.trim() || undefined,
      jobTitle:           jobTitle?.trim() || undefined,
      businessType:       businessType || undefined,
      emailVerifyToken:   hashToken(rawToken),
      emailVerifyExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 h
      status:             "pending",
    });

    await sendVerificationEmail(email, rawToken, name.trim());

    return NextResponse.json(
      { message: "Registration successful. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
