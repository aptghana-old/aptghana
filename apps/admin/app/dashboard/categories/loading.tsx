import { PageHeaderSkeleton, Skeleton, ListItemSkeleton } from "@/components/ui/Skeleton";

export default function CategoriesLoading() {
  return (
    <div>
      <PageHeaderSkeleton hasAction={false} />
      <div className="px-4 sm:px-6 py-3" style={{ borderBottom: "1px solid var(--apt-border)" }}>
        <Skeleton width={260} height={32} rounded="md" />
      </div>
      <ListItemSkeleton count={8} />
    </div>
  );
}
