import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogBrowse from "@/components/catalog/CatalogBrowse";
import { fetchCatalogData } from "@/lib/catalog";

interface Props {
  params: Promise<{ group: string; category: string; subcategory: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { subcategory } = await params;
  const name = subcategory.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — APT Ghana Catalogue`,
    description: `Browse ${name} products from APT Ghana.`,
  };
}

export const revalidate = 300;

export default async function SubcategoryPage({ params, searchParams }: Props) {
  const { group, category, subcategory } = await params;
  const sp = await searchParams;
  const data = await fetchCatalogData([ group, category, subcategory ], sp);
  if (!data) notFound();
  return (
    <>
      <CatalogBrowse data={data} />
    </>
  );
}
