import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import {
  serializePaymentMethods,
  type PaymentMethodSubdoc,
} from "@/lib/account/payment-methods";

interface Params { params: Promise<{ id: string }> }

/** Set default or rename a saved payment method. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: { setDefault?: boolean; label?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("paymentMethods");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const target = user.paymentMethods.find((m: PaymentMethodSubdoc) => m._id.toString() === id);
    if (!target) return NextResponse.json({ error: "Payment method not found" }, { status: 404 });

    if (body.setDefault) {
      user.paymentMethods.forEach((m: PaymentMethodSubdoc) => { m.isDefault = false; });
      target.isDefault = true;
    }
    if (typeof body.label === "string") {
      target.label = body.label.trim().slice(0, 60) || target.label;
    }

    await user.save();
    return NextResponse.json({ ok: true, methods: serializePaymentMethods(user.paymentMethods) });
  } catch (err) {
    console.error("[me payment-methods PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("paymentMethods");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const removed = user.paymentMethods.find((m: PaymentMethodSubdoc) => m._id.toString() === id);
    if (!removed) return NextResponse.json({ error: "Payment method not found" }, { status: 404 });

    user.paymentMethods = user.paymentMethods.filter((m: PaymentMethodSubdoc) => m._id.toString() !== id);
    // Keep exactly one default when possible
    if (removed.isDefault && user.paymentMethods.length > 0) {
      user.paymentMethods[0].isDefault = true;
    }
    await user.save();
    return NextResponse.json({ ok: true, methods: serializePaymentMethods(user.paymentMethods) });
  } catch (err) {
    console.error("[me payment-methods DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
