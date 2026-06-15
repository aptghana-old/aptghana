import type { Metadata } from "next";
import { connectDB, BrandModel } from "@apt/db";
import { STORE_URL } from "@apt/config";
import { BrandsPageContent, type BrandListItem } from "@apt/ui";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Industrial Brand Partners | APT Ghana Store",
  description:
    "APT Ghana is the authorised distributor for 26+ world-class industrial brands including Schneider Electric, WEG, Camozzi, and more. Genuine products, manufacturer warranty.",
  alternates: { canonical: `${STORE_URL}/brands` },
};

const STATIC_BRANDS: BrandListItem[] = [
  { name: "WEG", slug: "weg", country: "Brazil", specialty: "Motors, drives & energy-efficient systems", isFeatured: false, isPartner: false },
  { name: "Camozzi", slug: "camozzi", country: "Italy", specialty: "Pneumatic & electric automation systems", isFeatured: false, isPartner: false },
  { name: "Schneider Electric", slug: "schneider-electric", country: "France", specialty: "Electrical distribution & automation", isFeatured: true, isPartner: true },
  { name: "Telemecanique", slug: "telemecanique", country: "France", specialty: "Control & signalling devices", isFeatured: false, isPartner: false },
  { name: "Provulco", slug: "provulco", country: "Belgium / Portugal", specialty: "Conveyor belts & industrial belting", isFeatured: false, isPartner: false },
  { name: "Socomec", slug: "socomec", country: "France", specialty: "UPS, power switching & energy management", isFeatured: false, isPartner: false },
  { name: "NORD", slug: "nord", country: "Germany", specialty: "Gear units, drives & motors", isFeatured: false, isPartner: false },
  { name: "Robit", slug: "robit", country: "Finland", specialty: "Rock drilling tools & consumables", isFeatured: false, isPartner: false },
  { name: "EMC", slug: "emc", country: "Italy", specialty: "Pneumatic cylinders & actuators", isFeatured: false, isPartner: false },
  { name: "Isenman", slug: "isenman", country: "Germany", specialty: "Conveyor accessories & industrial components", isFeatured: false, isPartner: false },
  { name: "Raymond Feghali Co.", slug: "rtf", country: "Lebanon", specialty: "Industrial supplies & components", isFeatured: false, isPartner: false },
  { name: "STAXX", slug: "staxx", country: "China", specialty: "Material handling & warehousing equipment", isFeatured: false, isPartner: false },
  { name: "Tramec", slug: "tramec", country: "Italy", specialty: "Precision gearboxes & geared motors", isFeatured: false, isPartner: false },
  { name: "INTERkraz", slug: "interkraz", country: "Germany", specialty: "Industrial couplings & drive components", isFeatured: false, isPartner: false },
  { name: "Pofer", slug: "pofer", country: "Italy", specialty: "Screw conveyors & bulk material handling", isFeatured: false, isPartner: false },
  { name: "Dongbo Chain", slug: "dongbo-chain", country: "China", specialty: "Industrial chains & power transmission", isFeatured: false, isPartner: false },
  { name: "RFS", slug: "rfs", country: "Italy", specialty: "Pneumatic actuators & control systems", isFeatured: false, isPartner: false },
  { name: "OLI Vibrators", slug: "olivibra", country: "Italy", specialty: "Vibration technology & flow aids", isFeatured: false, isPartner: false },
  { name: "Moro", slug: "moro", country: "Italy", specialty: "Vacuum pumps & fluid handling equipment", isFeatured: false, isPartner: false },
  { name: "Weidmuller", slug: "weidmuller", country: "Germany", specialty: "Electrical connectivity & automation", isFeatured: false, isPartner: false },
  { name: "Rexnord", slug: "rexnord", country: "USA", specialty: "Power transmission & industrial solutions", isFeatured: false, isPartner: false },
  { name: "Canalplast", slug: "canalplast", country: "Italy", specialty: "Cable management & trunking systems", isFeatured: false, isPartner: false },
  { name: "T-Scale", slug: "tscale", country: "Taiwan", specialty: "Precision weighing & industrial scales", isFeatured: false, isPartner: false },
  { name: "Brevini", slug: "brevini", country: "Italy", specialty: "Planetary gearboxes & hydraulic components", isFeatured: false, isPartner: false },
  { name: "Sang-A", slug: "sang-a", country: "South Korea", specialty: "Pneumatic fittings & tubing solutions", isFeatured: false, isPartner: false },
  { name: "WAMGROUP", slug: "wamgroup", country: "Italy", specialty: "Screw conveyors & bulk solids handling", isFeatured: false, isPartner: false },
];

async function getBrands(): Promise<BrandListItem[]> {
  try {
    await connectDB();
    const docs = await (BrandModel as any)
      .find({ status: "active" })
      .select("name slug country specialty isFeatured isPartner logo productCount displayOrder")
      .sort({ displayOrder: 1, name: 1 })
      .lean();
    if (!docs.length) return STATIC_BRANDS;
    return (docs as any[]).map((d: any) => ({
      name: d.name,
      slug: d.slug,
      country: d.country ?? "",
      specialty: d.specialty ?? "",
      isFeatured: d.isFeatured ?? false,
      isPartner: d.isPartner ?? false,
      logoUrl: d.logo?.url ?? "",
      productCount: d.productCount ?? 0,
    }));
  } catch {
    return STATIC_BRANDS;
  }
}

export default async function StoreBrandsPage() {
  const brands = await getBrands();
  return (
    <BrandsPageContent
      brands={brands}
      config={{
        containerClass: "container-store",
        brandHref: (slug) => `/brands/${slug}`,
        rfqHref: "/rfq",
        contactHref: "/contact",
      }}
    />
  );
}
