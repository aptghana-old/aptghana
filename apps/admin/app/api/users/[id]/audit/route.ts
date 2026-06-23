import { NextRequest, NextResponse } from "next/server";
import { connectDB, AuditLogModel } from "@apt/db";
import { requirePermission } from "@/lib/auth/require";
import mongoose from "mongoose";

/** GET /api/users/[id]/audit — fetch audit trail for an admin user */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const deny = await requirePermission("users:view");
  if (deny) return deny;

  try {
    await connectDB();
    const { id } = await params;

    const logs = await AuditLogModel.find({
      entityType: "admin",
      entityId: new mongoose.Types.ObjectId(id),
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ logs });
  } catch (err) {
    console.error("GET /api/users/[id]/audit", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
