import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft } from "lucide-react";

export default function OrderDetailLoading() {
  return (
    <div>
      <div
        className="flex items-center gap-4 px-4 sm:px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled>Orders</Button>
        <div style={{ width: 1, height: 20, background: "var(--apt-border)" }} />
        <Skeleton width={120} height={16} />
        <Skeleton width={70} height={20} rounded="full" className="ml-auto" />
      </div>

      <div className="p-4 sm:p-6 grid grid-cols-1 xl:grid-cols-3 gap-6 max-w-7xl">
        <div className="xl:col-span-2 space-y-5">
          <div className="card p-5">
            <TableSkeleton rows={3} cols={4} />
            <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid var(--apt-border)" }}>
              {[160, 140, 120, 150].map((w, i) => (
                <div key={i} className="flex justify-between">
                  <Skeleton width={80} height={13} />
                  <Skeleton width={w / 2} height={13} />
                </div>
              ))}
            </div>
          </div>
          <CardSkeleton lines={4} hasHeader />
        </div>
        <div className="space-y-4">
          {[4, 3, 4].map((lines, i) => <CardSkeleton key={i} lines={lines} />)}
        </div>
      </div>
    </div>
  );
}
