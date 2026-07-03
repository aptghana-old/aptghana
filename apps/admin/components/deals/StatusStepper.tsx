import { Fragment } from "react";
import { XCircle, AlertTriangle } from "lucide-react";

export interface StepperStep {
  key: string;
  label: string;
  icon: React.ReactNode;
  done: boolean;
  active: boolean;
}

/** Horizontal lifecycle stepper (mockup: 38px circles, green done states, pulsing ring on the active step). */
export function StatusStepper({ steps }: { steps: StepperStep[] }) {
  return (
    <div className="card px-4 sm:px-7 py-5 overflow-x-auto">
      <div className="flex items-start min-w-[460px]">
        {steps.map((st, i) => (
          <Fragment key={st.key}>
            {i > 0 && (
              <div
                className="flex-1 h-[3px] rounded mt-[19px]"
                style={{ background: st.done ? "#12B76A" : "var(--apt-border)" }}
              />
            )}
            <div className="flex flex-col items-center w-[88px] shrink-0">
              <div
                className="w-[38px] h-[38px] rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: st.done ? "#12B76A" : "var(--apt-bg-raised)",
                  color: st.done ? "#fff" : "var(--apt-text-disabled)",
                  boxShadow: st.active ? "0 0 0 3px rgba(18,183,106,0.25), 0 0 0 5px rgba(18,183,106,0.5)" : undefined,
                }}
              >
                {st.icon}
              </div>
              <span
                className="text-[11.5px] mt-2 text-center leading-tight"
                style={{ fontWeight: st.done ? 700 : 500, color: st.done ? "var(--apt-text-primary)" : "var(--apt-text-muted)" }}
              >
                {st.label}
              </span>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

const BANNER_TONES = {
  error: { accent: "#E4573D", text: "#C0392B", Icon: XCircle },
  warning: { accent: "#D97706", text: "#B45309", Icon: AlertTriangle },
} as const;

/** Terminal-state banner shown instead of the stepper (cancelled / refunded / expired). */
export function StatusBanner({ title, description, tone = "error" }: { title: string; description: string; tone?: keyof typeof BANNER_TONES }) {
  const { accent, text, Icon } = BANNER_TONES[tone];
  return (
    <div
      className="rounded-xl px-5 py-4 flex items-center gap-3.5"
      style={{ background: `color-mix(in srgb, ${accent} 9%, var(--apt-bg))`, border: `1px solid color-mix(in srgb, ${accent} 35%, var(--apt-bg))` }}
    >
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: accent }}>
        <Icon size={20} color="#fff" />
      </div>
      <div className="min-w-0">
        <div className="text-[15px] font-bold" style={{ color: text }}>{title}</div>
        <div className="text-[12.5px] mt-0.5" style={{ color: "var(--apt-text-secondary)" }}>{description}</div>
      </div>
    </div>
  );
}
