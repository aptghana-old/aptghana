import { forwardRef } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  wrapperClass?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, icon, iconRight, wrapperClass = "", className = "", ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
        {label && (
          <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
            {label}
            {props.required && <span className="text-[#dc2626] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span
              className="absolute left-3 pointer-events-none"
              style={{ color: "var(--apt-text-muted)" }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={[
              "w-full h-9 rounded-md text-[13px] transition-colors",
              "placeholder:text-[var(--apt-text-muted)]",
              "focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)] focus:ring-offset-0",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              icon ? "pl-9" : "pl-3",
              iconRight ? "pr-9" : "pr-3",
              error
                ? "border-[#dc2626] bg-[#fef2f2]"
                : "border-[var(--apt-border)] bg-[var(--apt-bg)] hover:border-[var(--apt-border-strong)]",
              "border",
              className,
            ].join(" ")}
            style={{ color: "var(--apt-text-primary)" }}
            {...props}
          />
          {iconRight && (
            <span
              className="absolute right-3 pointer-events-none"
              style={{ color: "var(--apt-text-muted)" }}
            >
              {iconRight}
            </span>
          )}
        </div>
        {error ? (
          <p className="text-[11px] text-[#dc2626]">{error}</p>
        ) : hint ? (
          <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = "Input";

/* Textarea variant */
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClass?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, wrapperClass = "", className = "", ...props }, ref) => {
    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
        {label && (
          <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
            {label}
            {props.required && <span className="text-[#dc2626] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            "w-full rounded-md text-[13px] px-3 py-2.5 transition-colors resize-y",
            "placeholder:text-[var(--apt-text-muted)]",
            "focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            error
              ? "border-[#dc2626] bg-[#fef2f2]"
              : "border-[var(--apt-border)] bg-[var(--apt-bg)] hover:border-[var(--apt-border-strong)]",
            "border",
            className,
          ].join(" ")}
          style={{ color: "var(--apt-text-primary)", minHeight: 80 }}
          {...props}
        />
        {error ? (
          <p className="text-[11px] text-[#dc2626]">{error}</p>
        ) : hint ? (
          <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>
        ) : null}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";

/* Select variant */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  wrapperClass?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export function Select({ label, hint, error, wrapperClass = "", className = "", options, placeholder, ...props }: SelectProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${wrapperClass}`}>
      {label && (
        <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
          {label}
          {props.required && <span className="text-[#dc2626] ml-0.5">*</span>}
        </label>
      )}
      <select
        className={[
          "w-full h-9 rounded-md text-[13px] px-3 transition-colors appearance-none",
          "focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error
            ? "border-[#dc2626] bg-[#fef2f2]"
            : "border-[var(--apt-border)] bg-[var(--apt-bg)] hover:border-[var(--apt-border-strong)]",
          "border",
          className,
        ].join(" ")}
        style={{ color: "var(--apt-text-primary)" }}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      {error ? (
        <p className="text-[11px] text-[#dc2626]">{error}</p>
      ) : hint ? (
        <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>{hint}</p>
      ) : null}
    </div>
  );
}
