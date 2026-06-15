import type { Metadata } from "next";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ComingSoon } from "@/components/ui/ComingSoon";

export const metadata: Metadata = { title: "Zero Results" };

export default function SearchGapsPage() {
  return (
    <div>
      <PageHeader
        title="Zero-Result Searches"
        description="Queries that returned no results — opportunities to add synonyms or products."
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />}>Add Synonym</Button>}
      />
      <div className="p-6">
        <div className="card">
          <ComingSoon
            icon={<AlertCircle size={24} />}
            title="Zero-Result Detection"
            description="Automatically log searches that return zero results. Turn gaps into synonyms, redirects, or new product additions."
            accentColor="#d97706"
            accentBg="#fffbeb"
            milestones={[
              { label: "Zero-result logging from Meilisearch", done: false },
              { label: "Gap reporting dashboard", done: false },
              { label: "One-click synonym creation", done: false },
              { label: "Weekly gap summary email", done: false },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
