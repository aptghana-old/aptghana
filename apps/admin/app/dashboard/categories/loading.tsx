import { PageHeaderSkeleton, MetricCardSkeleton, Skeleton, ListItemSkeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction={false} />
      <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 items-start">
          <div className="xl:col-span-2 card p-2">
            <div className="px-2 py-2">
              <Skeleton width={260} height={32} rounded="md" />
            </div>
            <ListItemSkeleton count={8} />
          </div>
          <div className="flex flex-col gap-4">
            <div className="card p-5 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={22} rounded="md" />)}
            </div>
            <div className="card p-5 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} height={26} rounded="md" />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
