import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import {
  sanitizeAddress,
  serializeAddresses,
  type AddressInput,
  type AddressSubdoc,
} from "@/lib/account/addresses";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("addresses").lean<{ addresses?: AddressSubdoc[] }>();
    return NextResponse.json({ addresses: serializeAddresses(user?.addresses ?? []) });
  } catch (err) {
    console.error("[me addresses GET]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: AddressInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const address = sanitizeAddress(body);
  if (!address.line1 || !address.city) {
    return NextResponse.json({ error: "Street address and city are required" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("addresses");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.addresses.length >= 20) {
      return NextResponse.json({ error: "Address book limit reached (20)" }, { status: 409 });
    }

    const first = user.addresses.length === 0;
    const wantsShipping = first || Boolean(body.isDefaultShipping);
    const wantsBilling = first || Boolean(body.isDefaultBilling);

    if (wantsShipping) {
      user.addresses.forEach((a: AddressSubdoc) => { a.isDefaultShipping = false; a.isDefault = false; });
    }
    if (wantsBilling) {
      user.addresses.forEach((a: AddressSubdoc) => { a.isDefaultBilling = false; });
    }
    user.addresses.push({
      ...address,
      isDefaultShipping: wantsShipping,
      isDefaultBilling: wantsBilling,
    });
    await user.save();

    return NextResponse.json({ ok: true, addresses: serializeAddresses(user.addresses) }, { status: 201 });
  } catch (err) {
    console.error("[me addresses POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
