import { PageHeaderSkeleton, TableSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function CustomersLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction />
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-3"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Skeleton width={260} height={32} rounded="md" />
        <Skeleton width={90} height={32} rounded="md" />
      </div>
      <div className="p-4 sm:p-6">
        <TableSkeleton rows={10} cols={8} hasCheckbox />
      </div>
    </div>
  );
}
