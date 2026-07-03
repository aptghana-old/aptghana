import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function QuotesLoading() {
  return (
    <div>
      {/* Header */}
      <div
        className="flex items-end justify-between gap-4 px-4 sm:px-6 py-5 flex-wrap"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <div className="space-y-2">
          <Skeleton width={170} height={24} />
          <Skeleton width={280} height={13} />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton width={96} height={32} rounded="md" />
          <Skeleton width={110} height={32} rounded="md" />
        </div>
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-2 px-4 sm:px-6 py-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        {[80, 100, 90].map((w, i) => <Skeleton key={i} width={w} height={28} rounded="md" />)}
      </div>

      <div className="p-4 sm:p-6 space-y-4">
        {/* KPI cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card px-4.5 py-4 space-y-3">
              <Skeleton width="60%" height={12} />
              <Skeleton width="45%" height={26} />
            </div>
          ))}
        </div>

        {/* Analytics band */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr_1fr] gap-4">
          <div className="card p-5 space-y-4">
            <Skeleton width={140} height={12} />
            <Skeleton height={180} rounded="lg" />
          </div>
          <CardSkeleton lines={6} hasHeader />
          <CardSkeleton lines={5} hasHeader />
        </div>

        {/* Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {[90, 110, 120, 100, 110].map((w, i) => <Skeleton key={i} width={w} height={30} rounded="full" />)}
        </div>

        <TableSkeleton rows={8} cols={7} />
      </div>
    </div>
  );
}
