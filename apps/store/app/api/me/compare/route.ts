import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB, UserModel } from "@apt/db";

const MAX_ITEMS = 4;

interface CompareItemInput {
  id?: string;
  name?: string;
  slug?: string;
  imageUrl?: string;
  brandName?: string;
}

/** The signed-in user's persisted compare list. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ items: [] });

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id)
      .select("compareList")
      .lean<{ compareList?: { productId: string; name?: string; slug?: string; imageUrl?: string; brandName?: string }[] }>();
    return NextResponse.json({
      items: (user?.compareList ?? []).map((c) => ({
        id: c.productId,
        name: c.name ?? "",
        slug: c.slug ?? "",
        imageUrl: c.imageUrl ?? "",
        brandName: c.brandName ?? "",
      })),
    });
  } catch (err) {
    console.error("[me compare GET]", err);
    return NextResponse.json({ items: [] });
  }
}

/** Replace the persisted compare list (client state is the source of truth). */
export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { items?: CompareItemInput[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const str = (v: unknown, max = 300) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const items = (Array.isArray(body.items) ? body.items : [])
    .slice(0, MAX_ITEMS)
    .map((i) => ({
      productId: str(i.id, 40),
      name: str(i.name),
      slug: str(i.slug, 200),
      imageUrl: str(i.imageUrl, 1000),
      brandName: str(i.brandName, 100),
    }))
    .filter((i) => i.productId);

  try {
    await connectDB();
    await UserModel.findByIdAndUpdate(session.user.id, { $set: { compareList: items } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[me compare PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
