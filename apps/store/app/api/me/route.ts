import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import { getProfile } from "@/lib/account/profile";

function str(v: unknown, max = 200): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

const BUSINESS_TYPES = ["contractor", "engineer", "procurement", "reseller", "end-user", "other"];

/** Full profile for the account portal (prefills every form). */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const profile = await getProfile(session.user.id);
    if (!profile) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ profile });
  } catch (err) {
    console.error("[me GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/** Update profile fields and notification preferences. */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    firstName?: string; lastName?: string; phone?: string; company?: string;
    jobTitle?: string; businessType?: string;
    notificationPrefs?: Record<string, boolean>;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await connectDB();
    const update: Record<string, unknown> = {};

    if (body.firstName !== undefined || body.lastName !== undefined) {
      const name = [str(body.firstName, 100), str(body.lastName, 100)].filter(Boolean).join(" ");
      if (!name) return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      update.name = name;
    }
    if (body.phone !== undefined)    update.phone = str(body.phone, 50);
    if (body.company !== undefined)  update.company = str(body.company, 200);
    if (body.jobTitle !== undefined) update.jobTitle = str(body.jobTitle, 100);
    if (body.businessType !== undefined) {
      update.businessType = BUSINESS_TYPES.includes(String(body.businessType))
        ? body.businessType
        : undefined;
    }
    if (body.notificationPrefs && typeof body.notificationPrefs === "object") {
      const prefs: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(body.notificationPrefs).slice(0, 40)) {
        prefs[String(k).slice(0, 60)] = Boolean(v);
      }
      update.notificationPrefs = prefs;
    }

    const user = await UserModel.findByIdAndUpdate(session.user.id, { $set: update }, { new: true })
      .select("name avatar")
      .lean<{ name: string; avatar?: string }>();
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json({ ok: true, name: user.name });
  } catch (err) {
    console.error("[me PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

