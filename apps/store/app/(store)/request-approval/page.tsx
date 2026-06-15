import type { Metadata } from "next";
import ApprovalWorkspace from "@/components/procurement/ApprovalWorkspace";
import { loadPrefill } from "@/lib/workflow/prefill";

export const metadata: Metadata = {
  title: "Request for Approval | APT Ghana",
  description:
    "Submit your procurement list for pricing and approval. Approved requests become orders with a secure online payment link.",
};

export default async function RequestApprovalPage() {
  const { prefill, isAuthenticated } = await loadPrefill();
  return <ApprovalWorkspace prefill={prefill} isAuthenticated={isAuthenticated} />;
}
