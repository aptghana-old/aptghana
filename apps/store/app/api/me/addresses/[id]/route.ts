import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";
import {
  sanitizeAddress,
  serializeAddresses,
  type AddressInput,
  type AddressSubdoc,
} from "@/lib/account/addresses";

interface Params { params: Promise<{ id: string }> }

/** Edit an address or change its default shipping/billing designation. */
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  let body: AddressInput & { setDefaultShipping?: boolean; setDefaultBilling?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("addresses");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const target = user.addresses.find((a: AddressSubdoc) => a._id.toString() === id);
    if (!target) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    // Field edits (only when address fields were sent)
    if (body.line1 !== undefined || body.city !== undefined || body.label !== undefined) {
      const next = sanitizeAddress({ ...(target.toObject?.() ?? {}), ...body });
      if (!next.line1 || !next.city) {
        return NextResponse.json({ error: "Street address and city are required" }, { status: 400 });
      }
      Object.assign(target, next);
    }

    // Default designations — exclusive per type
    if (body.setDefaultShipping) {
      user.addresses.forEach((a: AddressSubdoc) => { a.isDefaultShipping = false; a.isDefault = false; });
      target.isDefaultShipping = true;
    }
    if (body.setDefaultBilling) {
      user.addresses.forEach((a: AddressSubdoc) => { a.isDefaultBilling = false; });
      target.isDefaultBilling = true;
    }

    await user.save();
    return NextResponse.json({ ok: true, addresses: serializeAddresses(user.addresses) });
  } catch (err) {
    console.error("[me addresses PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("addresses");
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const before = user.addresses.length;
    user.addresses = user.addresses.filter((a: AddressSubdoc) => a._id.toString() !== id);
    if (user.addresses.length === before) {
      return NextResponse.json({ error: "Address not found" }, { status: 404 });
    }
    await user.save();
    return NextResponse.json({ ok: true, addresses: serializeAddresses(user.addresses) });
  } catch (err) {
    console.error("[me addresses DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
