import { Skeleton, MetricCardSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function CustomerDetailLoading() {
  return (
    <div>
      <div className="px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Skeleton width={100} height={24} rounded="md" />
        <div className="flex items-center gap-3.5 mt-3">
          <Skeleton width={48} height={48} rounded="full" />
          <div className="space-y-2">
            <Skeleton width={220} height={20} />
            <Skeleton width={300} height={14} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 p-4 sm:p-6 pb-0">
        {Array.from({ length: 6 }).map((_, i) => <MetricCardSkeleton key={i} />)}
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        <Skeleton width={420} height={36} rounded="lg" />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <CardSkeleton lines={4} />
          <CardSkeleton lines={4} />
        </div>
      </div>
    </div>
  );
}
