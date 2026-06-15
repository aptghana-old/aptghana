import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CatalogBrowse from "@/components/catalog/CatalogBrowse";
import { fetchCatalogData } from "@/lib/catalog";

interface Props {
  params: Promise<{ group: string; category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const name = category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `${name} — APT Ghana Catalogue`,
    description: `Browse ${name} products from APT Ghana.`,
  };
}

export const revalidate = 300;

export default async function CategoryPage({ params, searchParams }: Props) {
  const { group, category } = await params;
  const sp = await searchParams;
  const data = await fetchCatalogData([ group, category ], sp);
  if (!data) notFound();
  return (
    <>
      <CatalogBrowse data={data} />
    </>
  );
}
