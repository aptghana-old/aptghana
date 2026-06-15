"use client";

import { createContext, useContext, useState } from "react";

type TabsCtx = { active: string; set(v: string): void };
const Ctx = createContext<TabsCtx>({ active: "", set() {} });

export function Tabs({ defaultValue, children, className = "" }: { defaultValue: string; children: React.ReactNode; className?: string }) {
  const [active, setActive] = useState(defaultValue);
  return (
    <Ctx.Provider value={{ active, set: setActive }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabList({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`flex items-center gap-1 p-1 rounded-lg ${className}`}
      style={{ background: "var(--apt-bg-raised)", width: "fit-content" }}
      role="tablist"
    >
      {children}
    </div>
  );
}

export function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const { active, set } = useContext(Ctx);
  const isActive = active === value;
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => set(value)}
      className="px-3 py-1.5 rounded-md text-[13px] font-medium transition-all"
      style={{
        background: isActive ? "var(--apt-bg)" : "transparent",
        color: isActive ? "var(--apt-text-primary)" : "var(--apt-text-muted)",
        boxShadow: isActive ? "var(--shadow-xs)" : "none",
      }}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const { active } = useContext(Ctx);
  if (active !== value) return null;
  return <div role="tabpanel">{children}</div>;
}
