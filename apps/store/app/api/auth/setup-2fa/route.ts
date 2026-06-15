import { NextRequest, NextResponse } from "next/server";
import { generateSecret, verify as totpVerify, generateURI } from "otplib";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { sendTwoFAAlert } from "@/lib/auth/email";

/* GET — generate a new TOTP secret for the current user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const secret  = generateSecret();
  const otpauth = generateURI({ issuer: "APT Ghana", label: session.user.email ?? session.user.id, secret });

  // Store as pending (not yet confirmed)
  await connectDB();
  await UserModel.findByIdAndUpdate(session.user.id, { mfaSecret: secret });

  return NextResponse.json({ secret, otpauth });
}

/* POST — verify OTP to confirm and enable 2FA */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { otp } = await req.json();
    if (!otp) return NextResponse.json({ error: "OTP is required." }, { status: 400 });

    await connectDB();
    const user = await UserModel
      .findById(session.user.id)
      .select("+mfaSecret")
      .lean<{ mfaSecret?: string }>();

    if (!user?.mfaSecret) {
      return NextResponse.json({ error: "No pending 2FA setup found." }, { status: 400 });
    }

    const result = await totpVerify({ token: otp.trim(), secret: user.mfaSecret });
    if (!result.valid) return NextResponse.json({ error: "Invalid code. Try again." }, { status: 400 });

    await UserModel.findByIdAndUpdate(session.user.id, { mfaEnabled: true });

    // Fire-and-forget security alert
    const fullUser = await UserModel.findById(session.user.id).select("email name").lean<{ email: string; name: string }>();
    if (fullUser) {
      sendTwoFAAlert(fullUser.email, fullUser.name, "enabled", { userId: session.user.id }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[setup-2fa]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

/* DELETE — disable 2FA after OTP confirmation */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { otp } = await req.json();
    if (!otp) return NextResponse.json({ error: "Confirm with your current 2FA code to disable." }, { status: 400 });

    await connectDB();
    const user = await UserModel
      .findById(session.user.id)
      .select("+mfaSecret")
      .lean<{ mfaSecret?: string; mfaEnabled?: boolean }>();

    if (!user?.mfaEnabled || !user?.mfaSecret) {
      return NextResponse.json({ error: "2FA is not enabled on this account." }, { status: 400 });
    }

    const result = await totpVerify({ token: otp.trim(), secret: user.mfaSecret });
    if (!result.valid) return NextResponse.json({ error: "Invalid code." }, { status: 400 });

    await UserModel.findByIdAndUpdate(session.user.id, { mfaEnabled: false, mfaSecret: undefined });

    // Fire-and-forget security alert
    const fullUser = await UserModel.findById(session.user.id).select("email name").lean<{ email: string; name: string }>();
    if (fullUser) {
      sendTwoFAAlert(fullUser.email, fullUser.name, "disabled", { userId: session.user.id }).catch(console.error);
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[disable-2fa]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
