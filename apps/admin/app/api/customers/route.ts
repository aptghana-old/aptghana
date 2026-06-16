import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, recordAudit } from "@apt/db";
import { hashPassword } from "@apt/auth";
import crypto from "crypto";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";
import { customerCreateSchema, parseBody } from "@apt/types";

/** POST /api/customers — admin-created customer record (manager/super_admin only). */
export async function POST(req: NextRequest) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  try {
    const session = await auth();
    const parsed = parseBody(customerCreateSchema, await req.json());
    if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 422 });
    const { name, email, phone, accountType, company, jobTitle, industry, website, taxNumber, status } = parsed.data;

    await connectDB();
    const existing = await UserModel.findOne({ email: email.trim().toLowerCase() }).lean();
    if (existing) {
      return NextResponse.json({ error: `A customer with email "${email}" already exists` }, { status: 409 });
    }

    // Admin-created accounts get a random password; the customer resets it via "forgot password"
    const passwordHash = await hashPassword(crypto.randomBytes(24).toString("hex"));

    const customer = await UserModel.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone?.trim() || undefined,
      passwordHash,
      accountType: accountType === "business" ? "business" : "personal",
      company: company?.trim() || undefined,
      jobTitle: jobTitle?.trim() || undefined,
      industry: industry?.trim() || undefined,
      website: website?.trim() || undefined,
      taxNumber: taxNumber?.trim() || undefined,
      status: status ?? "active",
      emailVerified: false,
    });

    await recordAudit({
      entityType: "user",
      entityId: customer._id,
      action: "customer_created",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: `Created by ${session?.user?.name ?? "an admin"}`,
    });

    return NextResponse.json({ id: customer._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/customers", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
