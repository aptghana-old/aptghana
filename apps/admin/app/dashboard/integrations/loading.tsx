import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, MetricCardSkeleton } from "@/components/ui/Skeleton";

function IntegrationCardSkeleton() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-4">
        <Skeleton width={48} height={48} rounded="lg" />
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2.5">
            <Skeleton width={120} height={16} />
            <Skeleton width={50} height={18} rounded="full" />
            <Skeleton width={80} height={18} rounded="full" />
          </div>
          <Skeleton height={13} style={{ width: "80%" }} />
          <div className="flex gap-1.5">
            <Skeleton width={90} height={20} rounded="sm" />
            <Skeleton width={80} height={20} rounded="sm" />
            <Skeleton width={70} height={20} rounded="sm" />
          </div>
        </div>
        <Skeleton width={38} height={22} rounded="full" />
      </div>
      <div className="flex items-center gap-6 mt-4 pt-3.5" style={{ borderTop: "1px solid var(--apt-border)" }}>
        <Skeleton width={60} height={28} />
        <Skeleton width={80} height={28} />
        <div className="flex-1" />
        <Skeleton width={90} height={30} rounded="md" />
      </div>
    </div>
  );
}

export default function IntegrationsLoading() {
  return (
    <div>
      <PageHeader title="Integrations" description="External services & APIs connected to the APT Ghana platform" />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {Array.from({ length: 4 }).map((_, i) => <MetricCardSkeleton key={i} />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[1.72fr_1fr] gap-4">
          <div className="flex flex-col gap-3.5">
            {Array.from({ length: 5 }).map((_, i) => <IntegrationCardSkeleton key={i} />)}
          </div>
          <div className="space-y-4">
            <div className="card h-64" />
            <div className="card h-40" />
          </div>
        </div>
      </div>
    </div>
  );
}
