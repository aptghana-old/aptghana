import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function AuditLoading() {
  return (
    <div>
      <PageHeader title="Audit Log" description="Loading activity history…" />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={10} cols={5} />
      </div>
    </div>
  );
}
