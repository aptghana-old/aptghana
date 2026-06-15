import { PageHeader } from "@/components/ui/PageHeader";
import { TableSkeleton } from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div>
      <PageHeader title="Customers" description="Loading customers…" />
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={10} cols={5} hasCheckbox />
      </div>
    </div>
  );
}
