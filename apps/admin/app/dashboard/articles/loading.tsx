import { PageHeaderSkeleton, MetricCardSkeleton, Skeleton, ListItemSkeleton } from "@/components/ui/Skeleton";

export default function ArticlesLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction />
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 p-4 sm:p-6 pb-0">
        {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>
      <div className="px-4 sm:px-6 py-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <Skeleton width={260} height={32} rounded="md" />
      </div>
      <div className="p-4 sm:p-6">
        <ListItemSkeleton count={8} hasAvatar />
      </div>
    </div>
  );
}
