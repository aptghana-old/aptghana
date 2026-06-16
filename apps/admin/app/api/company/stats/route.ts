import { NextRequest, NextResponse } from "next/server";
import { connectDB, CompanyStatModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";

export async function POST(req: NextRequest) {
  const deny = await requirePermission('content:edit');
  if (deny) return deny;
  try {
    await connectDB();
    const body = await req.json();

    if (!body.value?.trim() || !body.label?.trim()) {
      return NextResponse.json({ error: "Value and label are required" }, { status: 400 });
    }

    const doc = await CompanyStatModel.create({
      value:        body.value.trim(),
      label:        body.label.trim(),
      displayOrder: body.displayOrder ?? 0,
      status:       body.status       ?? "active",
    });

    return NextResponse.json({ id: doc._id.toString() }, { status: 201 });
  } catch (err) {
    console.error("POST /api/company/stats", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
