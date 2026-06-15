import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ ids: [] });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id).select("favorites").lean();
    const ids = ((user as { favorites?: unknown[] })?.favorites ?? []).map(String);
    return NextResponse.json({ ids });
  } catch (err) {
    console.error("[wishlist GET]", err);
    return NextResponse.json({ ids: [] });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { productId } = (await req.json()) as { productId?: string };
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    await connectDB();
    await UserModel.findByIdAndUpdate(session.user.id, { $addToSet: { favorites: productId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wishlist POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const productId = new URL(req.url).searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId required" }, { status: 400 });

    await connectDB();
    await UserModel.findByIdAndUpdate(session.user.id, { $pull: { favorites: productId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[wishlist DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
