"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-12 text-center" style={{ minHeight: "calc(100vh - 57px)" }}>
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center"
        style={{ background: "rgba(220,38,38,0.1)" }}
      >
        <AlertTriangle size={24} style={{ color: "#dc2626" }} />
      </div>
      <div>
        <p className="text-[15px] font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>
          Something went wrong
        </p>
        <p className="text-[13px] max-w-sm" style={{ color: "var(--apt-text-muted)" }}>
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        {error.digest && (
          <p className="text-[11px] mt-2 font-mono" style={{ color: "var(--apt-text-muted)" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Button variant="primary" size="sm" onClick={reset}>
          Try again
        </Button>
        <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
