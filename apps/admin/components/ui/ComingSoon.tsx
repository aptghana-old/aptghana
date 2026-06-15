import { Button } from "@/components/ui/Button";
import { LucideIcon } from "lucide-react";

interface Milestone {
  label: string;
  done?: boolean;
}

interface ComingSoonProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  milestones?: Milestone[];
  docLink?: string;
  accentColor?: string;
  accentBg?: string;
}

export function ComingSoon({
  icon, title, description, milestones, accentColor = "#0057b8", accentBg = "#eff6ff",
}: ComingSoonProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
        style={{ background: accentBg }}
      >
        <span style={{ color: accentColor }}>{icon}</span>
      </div>

      <div
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
        style={{ background: accentBg, color: accentColor }}
      >
        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accentColor }} />
        In Development
      </div>

      <h2 className="text-[20px] font-semibold mb-3" style={{ color: "var(--apt-text-primary)" }}>
        {title}
      </h2>
      <p className="text-[14px] leading-relaxed mb-8" style={{ color: "var(--apt-text-muted)" }}>
        {description}
      </p>

      {milestones && milestones.length > 0 && (
        <div
          className="w-full rounded-xl p-5 text-left mb-6"
          style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-3" style={{ color: "var(--apt-text-muted)" }}>
            Development Roadmap
          </p>
          <div className="space-y-2">
            {milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold"
                  style={{
                    background: m.done ? "#dcfce7" : "var(--apt-bg)",
                    border: `1.5px solid ${m.done ? "#16a34a" : "var(--apt-border)"}`,
                    color: m.done ? "#16a34a" : "var(--apt-text-muted)",
                  }}
                >
                  {m.done ? "✓" : "○"}
                </div>
                <span
                  className="text-[13px]"
                  style={{
                    color: m.done ? "var(--apt-text-primary)" : "var(--apt-text-secondary)",
                    textDecoration: m.done ? "line-through" : "none",
                    opacity: m.done ? 0.6 : 1,
                  }}
                >
                  {m.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
