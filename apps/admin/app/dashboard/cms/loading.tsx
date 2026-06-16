import { PageHeader } from "@/components/ui/PageHeader";
import { ListItemSkeleton } from "@/components/ui/Skeleton";

export default function CmsLoading() {
  return (
    <div>
      <PageHeader title="Pages" description="Loading site pages…" />
      <div className="p-4 sm:p-6">
        <div className="card p-2">
          <ListItemSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
