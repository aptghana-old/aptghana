import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { ChevronLeft } from "lucide-react";

export default function OrderDetailLoading() {
  return (
    <div>
      <div
        className="flex items-center gap-3 px-4 sm:px-6 py-4 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        <Button variant="ghost" size="sm" icon={<ChevronLeft size={14} />} disabled>Orders</Button>
        <Skeleton width={140} height={19} />
        <Skeleton width={70} height={20} rounded="full" />
        <div className="ml-auto flex items-center gap-2">
          <Skeleton width={100} height={32} rounded="md" />
          <Skeleton width={120} height={32} rounded="md" />
        </div>
      </div>

      <div className="p-4 sm:p-6 max-w-[1400px] space-y-4">
        {/* Stepper */}
        <div className="card px-7 py-5 flex items-start justify-between gap-4 overflow-hidden">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <Skeleton width={38} height={38} rounded="full" />
              <Skeleton width={56} height={11} />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.7fr_1fr] gap-4">
          <div className="space-y-4">
            <div className="card p-5">
              <TableSkeleton rows={4} cols={4} />
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
            {[4, 3, 5].map((lines, i) => <CardSkeleton key={i} lines={lines} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
