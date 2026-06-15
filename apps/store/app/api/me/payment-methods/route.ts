import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import {
  sanitizePaymentMethod,
  serializePaymentMethods,
  type PaymentMethodInput,
  type PaymentMethodSubdoc,
} from "@/lib/account/payment-methods";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id)
      .select("paymentMethods")
      .lean<{ paymentMethods?: PaymentMethodSubdoc[] }>();
    return NextResponse.json({ methods: serializePaymentMethods(user?.paymentMethods ?? []) });
  } catch (err) {
    console.error("[me payment-methods GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: PaymentMethodInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const result = sanitizePaymentMethod(body);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 400 });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("paymentMethods");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.paymentMethods.length >= 10) {
      return NextResponse.json({ error: "Payment method limit reached (10)" }, { status: 409 });
    }

    const makeDefault = user.paymentMethods.length === 0 || result.method.isDefault;
    if (makeDefault) {
      user.paymentMethods.forEach((m: PaymentMethodSubdoc) => { m.isDefault = false; });
    }
    user.paymentMethods.push({ ...result.method, isDefault: makeDefault });
    await user.save();

    return NextResponse.json(
      { ok: true, methods: serializePaymentMethods(user.paymentMethods) },
      { status: 201 },
    );
  } catch (err) {
    console.error("[me payment-methods POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
