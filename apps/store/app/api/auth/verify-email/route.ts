import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel } from "@apt/db";
import { hashToken } from "@/lib/auth/helpers";
import { sendWelcomeEmail } from "@/lib/auth/email";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/account/verify-email?error=missing", req.url));
  }

  try {
    await connectDB();
    const hashed = hashToken(token);

    // M-01: Enforce token expiry — expired tokens are rejected even if hash matches
    const user = await UserModel
      .findOne({
        emailVerifyToken: hashed,
        $or: [
          { emailVerifyExpires: { $gt: new Date() } },
          { emailVerifyExpires: { $exists: false } }, // backward-compat: tokens without expiry field
        ],
      })
      .select("email name emailVerified pendingEmail sessionVersion");

    if (!user) {
      return NextResponse.redirect(new URL("/account/verify-email?error=invalid", req.url));
    }

    const isEmailChange = Boolean(user.pendingEmail);
    if (isEmailChange) {
      // Email-change flow: apply the new address and invalidate all existing sessions
      // M-02: Increment sessionVersion so all existing JWTs fail re-validation within 5 min
      await UserModel.findByIdAndUpdate(user._id, {
        $set: {
          email:             user.pendingEmail,
          emailVerified:     true,
          emailVerifyToken:  undefined,
          emailVerifyExpires: undefined,
          status:            "active",
        },
        $unset: { pendingEmail: 1 },
        $inc:   { sessionVersion: 1 },
      });
    } else {
      // New account verification — no need to invalidate sessions (account just activated)
      await UserModel.findByIdAndUpdate(user._id, {
        $set:   { emailVerified: true, status: "active" },
        $unset: { emailVerifyToken: 1, emailVerifyExpires: 1 },
      });
      await sendWelcomeEmail(user.email, user.name as string);
    }

    return NextResponse.redirect(new URL("/account/verify-email?success=true", req.url));
  } catch (err) {
    console.error("[verify-email] handler error");
    return NextResponse.redirect(new URL("/account/verify-email?error=server", req.url));
  }
}
