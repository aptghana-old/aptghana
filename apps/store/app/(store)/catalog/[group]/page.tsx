import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogBrowse from "@/components/catalog/CatalogBrowse";
import { fetchCatalogData } from "@/lib/catalog";
import { STORE_URL } from "@apt/config";

interface Props {
  params: Promise<{ group: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { group } = await params;
  const slug = group.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${slug} — APT Ghana Catalogue`,
    description: `Browse ${slug} products from APT Ghana — Ghana's premier industrial technology distributor.`,
    alternates: { canonical: `${STORE_URL}/catalog/${group}` },
  };
}

export const revalidate = 300;

export default async function GroupPage({ params, searchParams }: Props) {
  const { group } = await params;
  const sp = await searchParams;
  const data = await fetchCatalogData([ group ], sp);
  if (!data) notFound();
  return (
    <>
      <CatalogBrowse data={data} />
    </>
  );
}
