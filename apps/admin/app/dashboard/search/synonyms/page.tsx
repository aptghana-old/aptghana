import { redirect } from "next/navigation";

// Synonyms are now managed via the full Settings Editor
export default function SynonymsRedirect() {
  redirect("/dashboard/search/settings?index=products");
}
