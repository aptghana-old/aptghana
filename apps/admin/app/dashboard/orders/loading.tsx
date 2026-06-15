import { PageHeader } from "@/components/ui/PageHeader";
import { Skeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function OrdersLoading() {
  return (
    <div>
      <PageHeader title="Orders" description="Loading orders…" />
      {/* Status tabs skeleton */}
      <div
        className="flex items-center gap-1 px-4 sm:px-6 py-3 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {[60, 120, 60, 80, 80, 80, 80].map((w, i) => (
          <Skeleton key={i} width={w} height={28} rounded="md" className="shrink-0" />
        ))}
      </div>
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={10} cols={6} />
      </div>
    </div>
  );
}
