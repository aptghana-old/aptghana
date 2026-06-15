import type { Metadata } from "next";
import { redirect } from "next/navigation";
import RfqWorkspace from "@/components/procurement/RfqWorkspace";
import { loadPrefill, resolveSeedItem } from "@/lib/workflow/prefill";

export const metadata: Metadata = {
  title: "Request for Quotation | APT Ghana",
  description:
    "Request a quotation for individual products — including unpriced items and products not listed on our website. Attach datasheets and drawings.",
};

interface RFQPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function sp(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
}

export default async function RFQPage({ searchParams }: RFQPageProps) {
  const p = await searchParams;

  // Cart-based requests moved to the Request for Approval flow
  if ((sp(p.source) || sp(p.from)) === "cart") redirect("/request-approval");

  const productParam = sp(p.product);
  const skuParam     = sp(p.sku);
  const hasProductParam = Boolean(productParam || skuParam);

  const [seedItem, { prefill, isAuthenticated }] = await Promise.all([
    hasProductParam ? resolveSeedItem(productParam, skuParam) : Promise.resolve(null),
    loadPrefill(),
  ]);

  return (
    <RfqWorkspace
      seedItem={seedItem}
      seedNotFound={hasProductParam && !seedItem}
      prefill={prefill}
      isAuthenticated={isAuthenticated}
    />
  );
}
