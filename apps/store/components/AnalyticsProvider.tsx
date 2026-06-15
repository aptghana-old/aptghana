"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { tracker } from "@/lib/analytics/tracker";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialized = useRef(false);

  useEffect(() => {
    if (!initialized.current) {
      tracker.init();
      initialized.current = true;
    }
    tracker.trackPageView(pathname);
  }, [pathname]);

  // Flush on unmount (e.g. hard navigation away)
  useEffect(() => () => tracker.destroy(), []);

  return <>{children}</>;
}
