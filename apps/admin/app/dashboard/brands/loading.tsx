import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/Skeleton";
import { Plus } from "lucide-react";

export default function BrandsLoading() {
  return (
    <div>
      <PageHeader
        title="Brands"
        description="Loading brands…"
        actions={<Button variant="primary" size="sm" icon={<Plus size={13} />} disabled>Add Brand</Button>}
      />
      <div className="px-4 sm:px-6 pt-4 pb-4 sm:pb-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <MetricCardSkeleton key={i} />
          ))}
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Skeleton width={280} height={36} rounded="lg" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} width={90} height={32} rounded="full" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card p-[18px] space-y-3.5">
              <Skeleton width={46} height={46} rounded="lg" />
              <Skeleton height={16} style={{ width: "70%" }} />
              <Skeleton height={12} style={{ width: "45%" }} />
              <div className="flex items-center justify-between pt-1">
                <Skeleton width={60} height={16} />
                <Skeleton width={54} height={20} rounded="full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
