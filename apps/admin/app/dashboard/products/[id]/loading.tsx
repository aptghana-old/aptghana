import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft, Edit } from "lucide-react";

export default function ProductDetailLoading() {
  return (
    <div>
      {/* Breadcrumb bar */}
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled>Products</Button>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <Skeleton width={200} height={16} />
        <Skeleton width={60} height={20} rounded="full" className="ml-auto" />
        <Button variant="primary" size="sm" icon={<Edit size={13} />} disabled>Edit Product</Button>
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
        <div className="xl:col-span-2 space-y-5">
          {/* Image placeholder */}
          <div className="card p-5">
            <Skeleton height={280} rounded="lg" />
            <div className="flex gap-2 mt-4">
              {[1, 2, 3].map((i) => <Skeleton key={i} width={64} height={64} rounded="md" />)}
            </div>
          </div>
          <CardSkeleton lines={3} hasHeader />
          <CardSkeleton lines={8} hasHeader />
          <CardSkeleton lines={3} hasHeader />
        </div>
        <div className="space-y-4">
          {[5, 4, 3, 2].map((lines, i) => <CardSkeleton key={i} lines={lines} />)}
        </div>
      </div>
    </div>
  );
}
