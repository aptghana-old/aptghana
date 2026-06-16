"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Header, { type SessionUser } from "@/components/layout/Header";
import CommandPalette from "@/components/layout/CommandPalette";
import type { AdminRole } from "@apt/auth";

interface DashboardShellProps {
  children: React.ReactNode;
  user: SessionUser;
  role: AdminRole;
  permissions: string[];
}

export default function DashboardShell({ children, user, role, permissions }: DashboardShellProps) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setMobileNavOpen(false); }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full min-h-screen" style={{ background: "var(--apt-bg-subtle)" }}>
      <Sidebar
        mobileOpen={mobileNavOpen}
        onMobileClose={() => setMobileNavOpen(false)}
        role={role}
        permissions={permissions}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header
          user={user}
          onCommandPalette={() => setPaletteOpen(true)}
          onMobileMenuToggle={() => setMobileNavOpen((v) => !v)}
        />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
