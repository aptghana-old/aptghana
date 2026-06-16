import { NextRequest, NextResponse } from "next/server";
import { connectDB, UserModel, recordAudit } from "@apt/db";
import { emailService } from "@apt/email";
import { requirePermission } from "@/lib/auth/require";
import { auth } from "@/lib/auth";

interface Params { params: Promise<{ id: string }> }

/** Send a one-off account notification email to the customer (logged to EmailLog). */
export async function POST(req: NextRequest, { params }: Params) {
  const deny = await requirePermission("customers:edit");
  if (deny) return deny;

  const { id } = await params;
  let body: { subject?: string; title?: string; body?: string; type?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const subject = body.subject?.trim();
  const message = body.body?.trim();
  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and message are required" }, { status: 422 });
  }

  try {
    const session = await auth();
    await connectDB();
    const customer = await UserModel.findById(id).select("name email").lean<{ name: string; email: string }>();
    if (!customer) return NextResponse.json({ error: "Customer not found" }, { status: 404 });

    const allowedTypes = ["info", "warning", "success", "alert"] as const;
    const type = allowedTypes.includes(body.type as typeof allowedTypes[number])
      ? (body.type as typeof allowedTypes[number])
      : "info";

    const result = await emailService.send(
      customer.email,
      {
        kind: "account-notification",
        payload: {
          name: customer.name,
          subject,
          title: body.title?.trim() || subject,
          body: message,
          type,
        },
      },
      { userId: id, meta: { sentBy: session?.user?.name ?? "admin" } }
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error ?? "Email failed to send" }, { status: 502 });
    }

    await recordAudit({
      entityType: "user",
      entityId: id,
      action: "email_sent",
      actor: { type: "sales", id: session?.user?.id, name: session?.user?.name ?? "Admin" },
      message: subject,
    });

    return NextResponse.json({ ok: true, messageId: result.messageId });
  } catch (err) {
    console.error("POST /api/customers/[id]/email", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
