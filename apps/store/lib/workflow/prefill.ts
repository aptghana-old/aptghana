import { auth } from "@/lib/auth";
import { connectDB, ProductModel, BrandModel, UserModel } from "@apt/db";

/* Server-side helpers shared by the Request for Approval and RFQ pages. */

export interface RequestPrefill {
  firstName: string;
  lastName:  string;
  email:     string;
  phone:     string;
  company:   string;
  country:   string;
  address:   string;
}

export interface RequestSeedItem {
  productId: string;
  sku?:      string;
  name:      string;
  brandName?: string;
  imageUrl:  string;
  minQty:    number;
}

const COUNTRY_NAMES: Record<string, string> = {
  GH: "Ghana", NG: "Nigeria", CI: "Côte d'Ivoire", TG: "Togo",
  BF: "Burkina Faso", LR: "Liberia", SL: "Sierra Leone",
};

function titleCase(slug: string): string {
  return slug.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

interface UserPrefillDoc {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  addresses?: {
    line1?: string; line2?: string; city?: string;
    region?: string; country?: string; isDefault?: boolean;
  }[];
}

/** Resolve ?product= / ?sku= into a seed item for a single-product RFQ. */
export async function resolveSeedItem(productParam: string, skuParam: string): Promise<RequestSeedItem | null> {
  const or: Record<string, string>[] = [];
  if (skuParam) or.push({ sku: skuParam.toUpperCase() });
  if (productParam) {
    or.push({ slug: productParam.toLowerCase() }, { sku: productParam.toUpperCase() });
    if (/^[a-f0-9]{24}$/i.test(productParam)) or.push({ _id: productParam });
  }
  if (!or.length) return null;

  try {
    await connectDB();
    const product = await ProductModel.findOne({ $or: or })
      .select("sku name brandSlug images.main.url pricing.minimumOrderQty")
      .lean<{
        _id: unknown;
        sku: string;
        name: string;
        brandSlug: string;
        images?: { main?: { url?: string } };
        pricing?: { minimumOrderQty?: number };
      }>();
    if (!product) return null;

    const brand = await BrandModel.findOne({ slug: product.brandSlug })
      .select("name")
      .lean<{ name?: string }>();

    return {
      productId: String(product._id),
      sku:       product.sku,
      name:      product.name,
      brandName: brand?.name ?? titleCase(product.brandSlug),
      imageUrl:  product.images?.main?.url ?? "",
      minQty:    Math.max(1, product.pricing?.minimumOrderQty ?? 1),
    };
  } catch (err) {
    console.error("[procurement] seed product lookup failed", err);
    return null;
  }
}

/** Prefill contact details from the authenticated user's profile. */
export async function loadPrefill(): Promise<{ prefill: RequestPrefill; isAuthenticated: boolean }> {
  const empty: RequestPrefill = {
    firstName: "", lastName: "", email: "", phone: "",
    company: "", country: "", address: "",
  };

  const session = await auth();
  if (!session?.user?.id) return { prefill: empty, isAuthenticated: false };

  try {
    await connectDB();
    const user = await UserModel.findById(session.user.id)
      .select("name email phone company addresses")
      .lean<UserPrefillDoc>();
    if (!user) return { prefill: { ...empty, email: session.user.email ?? "" }, isAuthenticated: true };

    const [firstName = "", ...rest] = (user.name ?? "").trim().split(/\s+/);
    const addr = user.addresses?.find((a) => a.isDefault) ?? user.addresses?.[0];
    const addressParts = addr ? [addr.line1, addr.line2, addr.city, addr.region].filter(Boolean) : [];
    const countryCode = addr?.country ?? "";

    return {
      isAuthenticated: true,
      prefill: {
        firstName,
        lastName: rest.join(" "),
        email:    user.email ?? session.user.email ?? "",
        phone:    user.phone ?? "",
        company:  user.company ?? "",
        country:  COUNTRY_NAMES[countryCode] ?? countryCode,
        address:  addressParts.join(", "),
      },
    };
  } catch (err) {
    console.error("[procurement] prefill lookup failed", err);
    return { prefill: { ...empty, email: session.user.email ?? "" }, isAuthenticated: true };
  }
}
