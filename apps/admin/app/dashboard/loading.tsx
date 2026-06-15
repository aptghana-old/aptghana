import { Button } from "@/components/ui/Button";
import { DashboardMetricsSkeleton, Skeleton, ChartSkeleton } from "@/components/ui/Skeleton";
import { Package } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div>
      <div
        className="flex items-start justify-between gap-4 px-4 sm:px-6 py-5"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <div className="space-y-2">
          <Skeleton width={160} height={22} />
          <Skeleton width={220} height={14} />
        </div>
        <Button variant="primary" size="sm" icon={<Package size={13} />} disabled>Add Product</Button>
      </div>

      <div className="p-4 sm:p-6 space-y-6">
        <DashboardMetricsSkeleton />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card overflow-hidden">
            <div className="card-header">
              <Skeleton width={160} height={16} />
            </div>
            <div className="p-5 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton width={72} height={13} />
                  <Skeleton height={13} style={{ flex: 1 }} />
                  <Skeleton width={36} height={13} />
                  <Skeleton width={60} height={20} rounded="full" />
                  <Skeleton width={52} height={13} />
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-4">
            <div className="card p-5 space-y-2">
              <Skeleton width={100} height={15} className="mb-3" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} height={40} rounded="lg" style={{ width: "100%" }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
