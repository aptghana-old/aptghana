import { Skeleton, FormSkeleton } from "@/components/ui/Skeleton";

export default function NewCustomerLoading() {
  return (
    <div>
      <div className="flex items-center gap-4 px-6 py-4" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}>
        <Skeleton width={100} height={24} rounded="md" />
        <Skeleton width={140} height={18} />
      </div>
      <div className="p-4 sm:p-6 max-w-4xl space-y-5">
        <FormSkeleton fields={6} cols={2} />
        <FormSkeleton fields={5} cols={2} />
      </div>
    </div>
  );
}
