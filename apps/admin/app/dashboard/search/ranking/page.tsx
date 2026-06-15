import { redirect } from "next/navigation";

// Ranking rules are now managed via the full Settings Editor
export default function RankingRedirect() {
  redirect("/dashboard/search/settings?index=products");
}
