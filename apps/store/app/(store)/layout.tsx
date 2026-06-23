import StoreHeader from "@/components/navigation/StoreHeader";
import StoreFooter from "@/components/navigation/StoreFooter";
import { connectDB, CategoryModel } from "@apt/db";
import type { NavGroup } from "@/app/layout";

const GROUP_META: Record<string, {
  color: string;
  iconPath: string;
  featured: { name: string; tag: string; href: string; desc: string };
}> = {
  "electrical-solutions": {
    color: "#3DCD58",
    iconPath: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    featured: { name: "Schneider Electric", tag: "Authorized Partner", href: "/brands/schneider-electric", desc: "Complete electrical infrastructure solutions" },
  },
  "electric-motors-gearboxes": {
    color: "#0369a1",
    iconPath: "M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z",
    featured: { name: "WEG", tag: "Preferred Distributor", href: "/brands/weg", desc: "World-class motors and drives" },
  },
  "pneumatic-solutions": {
    color: "#0891b2",
    iconPath: "M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3Z",
    featured: { name: "Camozzi", tag: "Exclusive Distributor", href: "/brands/camozzi", desc: "Precision Italian pneumatic engineering" },
  },
  "conveying-solutions": {
    color: "#7c3aed",
    iconPath: "M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5",
    featured: { name: "Tramec", tag: "Authorized Partner", href: "/brands/tramec", desc: "Conveyor components and solutions" },
  },
  "mechanical-power-transmission": {
    color: "#d97706",
    iconPath: "M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75",
    featured: { name: "NORD", tag: "Authorized Partner", href: "/brands/nord", desc: "Gear motors and drive technology" },
  },
  "hydraulic-solutions": {
    color: "#0057b8",
    iconPath: "M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 2.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125",
    featured: { name: "Brevini", tag: "Partner", href: "/brands/brevini", desc: "Hydraulic systems and gearboxes" },
  },
};

const DEFAULT_META = {
  color: "#64748b",
  iconPath: "M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z",
  featured: { name: "APT Ghana", tag: "Authorized Distributor", href: "/brands", desc: "Industrial solutions for West Africa" },
};

async function getNavGroups(): Promise<NavGroup[]> {
  try {
    await connectDB();
    const groups = await (CategoryModel as any)
      .find({ level: "group", status: "active" })
      .sort({ displayOrder: 1 }).limit(12).lean();
    if (!groups.length) return [];

    const groupIds = groups.map((g: any) => g._id);
    const allCategories = await (CategoryModel as any)
      .find({ parentId: { $in: groupIds }, level: "category", status: "active" })
      .sort({ displayOrder: 1 })
      .select("name slug shortDescription description image parentId").lean();

    const categoryIds = allCategories.map((c: any) => c._id);
    const rawSubcats = await (CategoryModel as any)
      .find({ parentId: { $in: categoryIds }, level: "subcategory", status: "active" })
      .sort({ displayOrder: 1 }).select("name slug parentId").lean();

    const catsByGroupId = new Map<string, any[]>();
    for (const cat of allCategories) {
      const key = String(cat.parentId);
      if (!catsByGroupId.has(key)) catsByGroupId.set(key, []);
      catsByGroupId.get(key)!.push(cat);
    }
    // Index subcats by parentId for O(1) lookup
    const subcatsByCatId = new Map<string, { name: string; slug: string; href: string }[]>();
    for (const sub of rawSubcats) {
      const key = String((sub as any).parentId);
      if (!subcatsByCatId.has(key)) subcatsByCatId.set(key, []);
      const arr = subcatsByCatId.get(key)!;
      if (arr.length < 4) arr.push({ name: (sub as any).name, slug: (sub as any).slug, href: "" }); // href filled below
    }

    return JSON.parse(JSON.stringify(groups.map((group: any) => {
      const meta = GROUP_META[ group.slug ] ?? DEFAULT_META;
      const categories = (catsByGroupId.get(String(group._id)) ?? []).map((cat: any) => {
        const subcategories = (subcatsByCatId.get(String(cat._id)) ?? []).map((s) => ({
          ...s,
          href: `/catalog/${group.slug}/${cat.slug}/${s.slug}`,
        }));
        return {
          name: cat.name, slug: cat.slug,
          img: cat.image ? { url: cat.image, alt: cat.name } : undefined,
          href: `/catalog/${group.slug}/${cat.slug}`,
          desc: (cat.shortDescription || cat.description || "").slice(0, 160),
          image: cat.image?.url ?? "",
          subcategories,
        };
      });
      return {
        id: String(group._id), label: group.name, slug: group.slug,
        href: `/catalog/${group.slug}`, color: meta.color, iconPath: meta.iconPath,
        iconImage: `/icons/groups/${group.slug}.png`, description: group.shortDescription ?? "",
        categories, featured: meta.featured,
      };
    })));
  } catch { return []; }
}

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const navGroups = await getNavGroups();
  return (
    <>
      <StoreHeader navGroups={navGroups} />
      {children}
      <StoreFooter />
    </>
  );
}
