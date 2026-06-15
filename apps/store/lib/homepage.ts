import { connectDB, HomepageConfigModel, DEFAULT_HOMEPAGE_CONFIG } from "@apt/db";
import type { HomepageConfigData } from "@apt/db";

export async function getPublishedHomepageConfig(): Promise<HomepageConfigData> {
  try {
    await connectDB();
    const doc = await HomepageConfigModel.findOne({ status: "published" }).lean();
    if (doc) return doc as unknown as HomepageConfigData;
  } catch {
    // DB unavailable — fall back to defaults
  }

  return {
    ...DEFAULT_HOMEPAGE_CONFIG,
    status: "published",
    version: 0,
    publishedAt: null,
    publishedBy: null,
  };
}
