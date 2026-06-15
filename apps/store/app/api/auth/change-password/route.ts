import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { verifyPassword, hashPassword, isPasswordValid } from "@/lib/auth/helpers";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Both passwords are required." }, { status: 400 });
    }
    if (!isPasswordValid(newPassword)) {
      return NextResponse.json(
        { error: "New password must be at least 8 characters with uppercase, lowercase, and a number." },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await UserModel.findById(session.user.id).select("+passwordHash");
    if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

    const valid = await verifyPassword(currentPassword, (user as { passwordHash: string }).passwordHash);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });

    (user as { passwordHash: string }).passwordHash = await hashPassword(newPassword);
    await (user as { save: () => Promise<void> }).save();

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("[change-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
