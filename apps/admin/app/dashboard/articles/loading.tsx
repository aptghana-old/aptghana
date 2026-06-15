import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function ArticlesLoading() {
  return (
    <div>
      <PageHeader
        title="Articles"
        description="Loading content library…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>New Article</Button>}
      />
      <div
        className="flex items-center gap-1 px-4 sm:px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {[60, 80, 90, 80, 70].map((w, i) => (
          <Skeleton key={i} width={w} height={28} rounded="md" className="shrink-0" />
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={8} cols={5} hasThumbnail />
      </div>
    </div>
  );
}
