import { connectDB, CategoryModel, IndustryModel, ResourceModel } from "@apt/db";
import HeaderClient, {
  type SolutionGroup,
  type NavIndustry,
  type NavResItem,
} from "./HeaderClient";

async function getGroups(): Promise<SolutionGroup[]> {
  try {
    await connectDB();
    const groups = await CategoryModel.find({ level: "group", status: "active" })
      .select("slug name description shortDescription image displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .limit(12)
      .lean();

    return (groups as unknown as {
      slug: string; name: string; description?: string;
      shortDescription?: string; image?: { url?: string; alt?: string };
    }[]).map((g) => ({
      slug:        g.slug,
      name:        g.name,
      description: g.description || g.shortDescription || "",
      image: {
        url: g.image?.url || "",
        alt: g.image?.alt || g.name,
      },
    }));
  } catch {
    return [];
  }
}

async function getNavIndustries(): Promise<NavIndustry[]> {
  try {
    await connectDB();
    const docs = await IndustryModel.find({ status: "active" })
      .select("slug name shortDescription")
      .sort({ displayOrder: 1, name: 1 })
      .limit(8)
      .lean();

    return (docs as unknown as { slug: string; name: string; shortDescription?: string }[]).map((d) => ({
      slug: d.slug,
      name: d.name,
      desc: d.shortDescription ?? "",
    }));
  } catch {
    return [];
  }
}

const NAV_RESOURCE_TYPES = ["library", "training", "cad", "case-studies", "news", "projects"] as const;

async function getNavResItems(): Promise<NavResItem[]> {
  try {
    await connectDB();
    const docs = await ResourceModel.find({
      status: "active",
      type:   { $in: NAV_RESOURCE_TYPES },
    })
      .select("slug type title tagline displayOrder")
      .sort({ displayOrder: 1, title: 1 })
      .lean();

    return (docs as unknown as { slug: string; type: string; title: string; tagline?: string }[]).map((d) => ({
      label: d.title,
      desc:  d.tagline ?? "",
      href:  `/resources/${d.slug}`,
      type:  d.type,
    }));
  } catch {
    return [];
  }
}

export default async function Header() {
  const [groups, navIndustries, navResItems] = await Promise.all([
    getGroups(),
    getNavIndustries(),
    getNavResItems(),
  ]);

  return (
    <HeaderClient
      groups={groups}
      navIndustries={navIndustries}
      navResItems={navResItems}
    />
  );
}
