import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function SearchLoading() {
  return (
    <div>
      <PageHeader title="Search" description="Meilisearch index management and configuration." />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Sync status card */}
        <div className="card p-5 flex items-center gap-4">
          <Skeleton width={44} height={44} rounded="lg" />
          <div className="flex-1 space-y-2">
            <Skeleton width={140} height={15} />
            <Skeleton width={200} height={13} />
          </div>
          <Skeleton width={100} height={32} rounded="md" />
        </div>
        {/* Index cards */}
        {[1, 2, 3].map((i) => <CardSkeleton key={i} lines={4} hasHeader />)}
      </div>
    </div>
  );
}
