import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardMetricsSkeleton, ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function AnalyticsLoading() {
  return (
    <div>
      <PageHeader title="Analytics" description="Platform performance and revenue metrics." />
      <div className="p-4 sm:p-6 space-y-6">
        <DashboardMetricsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><ChartSkeleton height={320} /></div>
          <ChartSkeleton height={320} />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-5">
            <TableSkeleton rows={5} cols={3} />
          </div>
          <div className="card p-5">
            <TableSkeleton rows={5} cols={3} />
          </div>
        </div>
      </div>
    </div>
  );
}
