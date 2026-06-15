import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { connectDB, UserModel, ProductModel } from "@apt/db";
import WishlistManager, { type WishlistProduct } from "@/components/account/WishlistManager";

export const metadata: Metadata = { title: "Wishlist" };

export default async function WishlistPage() {
  const session = await auth();
  await connectDB();

  const user = await UserModel.findById(session!.user.id)
    .select("favorites")
    .lean<{ favorites?: unknown[] }>();
  const ids = (user?.favorites ?? []).map(String);

  let items: WishlistProduct[] = [];
  if (ids.length) {
    const products = await ProductModel.find({ _id: { $in: ids } })
      .select("sku mpn slug name brandSlug images.main.url pricing.listPrice pricing.currency pricing.minimumOrderQty inventory.quantity status")
      .lean<{
        _id: unknown; sku: string; mpn?: string; slug: string; name: string; brandSlug: string;
        images?: { main?: { url?: string } };
        pricing?: { listPrice?: number; currency?: string; minimumOrderQty?: number };
        inventory?: { quantity?: number };
        status?: string;
      }[]>();

    // Preserve the order items were saved in (favorites array order)
    const byId = new Map(products.map((p) => [String(p._id), p]));
    items = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .map((p) => ({
        id: String(p._id),
        sku: p.sku,
        mpn: p.mpn ?? "",
        slug: p.slug,
        name: p.name,
        brandSlug: p.brandSlug,
        imageUrl: p.images?.main?.url ?? "",
        listPrice: p.pricing?.listPrice ?? 0,
        currency: p.pricing?.currency ?? "USD",
        minQty: Math.max(1, p.pricing?.minimumOrderQty ?? 1),
        inStock: (p.inventory?.quantity ?? 0) > 0,
        active: p.status === "active",
      }));
  }

  return <WishlistManager initial={items} />;
}
