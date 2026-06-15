import { connectDB, HomepageConfigModel, DEFAULT_HOMEPAGE_CONFIG } from "@apt/db";
import HomepageBuilder from "@/components/homepage/HomepageBuilder";
import type { HomepageConfigData } from "@apt/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Homepage Builder | APT Admin" };

export default async function HomepagePage() {
  await connectDB();

  const raw = await HomepageConfigModel.findOne({ status: "draft" }).lean();
  const published = await HomepageConfigModel.findOne({ status: "published" }).lean();

  const draft: HomepageConfigData = raw
    ? { ...(raw as unknown as HomepageConfigData) }
    : {
        ...DEFAULT_HOMEPAGE_CONFIG,
        status: "draft",
        version: 0,
        publishedAt: null,
        publishedBy: null,
      };

  const publishedVersion = published
    ? (published as unknown as HomepageConfigData).version ?? null
    : null;

  return (
    <HomepageBuilder
      initialDraft={draft}
      publishedVersion={publishedVersion}
    />
  );
}
