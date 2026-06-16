import type { MetadataRoute } from "next";
import { connectDB, ProductModel, CategoryModel, BrandModel } from "@apt/db";
import { STORE_URL } from "@apt/config";

export const revalidate = 3600;

const STATIC_ROUTES = [
  "",
  "products",
  "catalog",
  "brands",
  "search",
  "rfq",
  "cart",
  "privacy",
  "terms",
  "contact",
  "clearance",
  "library",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: path ? `${STORE_URL}/${path}` : STORE_URL,
    lastModified: new Date(),
    changeFrequency: path === "" ? "daily" : "weekly",
    priority: path === "" ? 1 : 0.6,
  }));

  try {
    await connectDB();

    const [products, categories, brands] = await Promise.all([
      ProductModel.find({ status: "active" })
        .select("sku updatedAt")
        .limit(50000)
        .lean(),
      CategoryModel.find({ status: "active" }).select("path updatedAt").lean(),
      BrandModel.find({}).select("slug updatedAt").lean(),
    ]);

    for (const p of products as unknown as {
      sku: string;
      updatedAt?: Date;
    }[]) {
      entries.push({
        url: `${STORE_URL}/products/${p.sku.toLowerCase()}`,
        lastModified: p.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.8,
      });
    }

    for (const c of categories as unknown as {
      path?: string;
      updatedAt?: Date;
    }[]) {
      if (!c.path) continue;
      entries.push({
        url: `${STORE_URL}/catalog/${c.path}`,
        lastModified: c.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    for (const b of brands as unknown as { slug: string; updatedAt?: Date }[]) {
      entries.push({
        url: `${STORE_URL}/brands/${b.slug}`,
        lastModified: b.updatedAt ?? new Date(),
        changeFrequency: "weekly",
        priority: 0.6,
      });
    }
  } catch (e) {
    console.error("[sitemap]", e);
  }

  // return entries;
  return [];
}
