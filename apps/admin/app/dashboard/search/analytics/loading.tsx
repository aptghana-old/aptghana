import { Skeleton, MetricCardSkeleton, CardSkeleton } from "@/components/ui/Skeleton";

export default function SearchAnalyticsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4 px-6 py-5" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <div className="space-y-2">
          <Skeleton width={200} height={22} />
          <Skeleton width={160} height={14} />
        </div>
      </div>
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {Array.from({ length: 10 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2"><CardSkeleton lines={6} hasHeader /></div>
          <CardSkeleton lines={4} hasHeader />
        </div>
        <CardSkeleton lines={6} hasHeader />
      </div>
    </div>
  );
}
