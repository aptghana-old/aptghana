import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";

function IntegrationCardSkeleton() {
  return (
    <div className="card p-6">
      <div className="flex items-start gap-5">
        <Skeleton width={48} height={48} rounded="lg" />
        <div className="flex-1 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <Skeleton width={120} height={16} />
              <Skeleton width={50} height={18} rounded="full" />
            </div>
            <Skeleton width={80} height={20} rounded="full" />
          </div>
          <Skeleton height={13} style={{ width: "80%" }} />
          <Skeleton height={12} style={{ width: "60%" }} />
          <div className="flex gap-2">
            <Skeleton width={90} height={28} rounded="md" />
            <Skeleton width={80} height={28} rounded="md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function IntegrationsLoading() {
  return (
    <div>
      <PageHeader title="Integrations" description="External services and APIs connected to the platform." />
      <div className="p-4 sm:p-6 space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <IntegrationCardSkeleton key={i} />)}
      </div>
    </div>
  );
}
