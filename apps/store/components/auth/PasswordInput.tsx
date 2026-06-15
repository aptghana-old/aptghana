"use client";

import { useState } from "react";
import { passwordStrength } from "@/lib/auth/helpers";

interface PasswordInputProps {
  id: string;
  name: string;
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  showStrength?: boolean;
  disabled?: boolean;
}

export default function PasswordInput({
  id, name, value, onChange, label, placeholder = "••••••••",
  required = false, autoComplete = "current-password", showStrength = false, disabled = false,
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);
  const strength = showStrength && value ? passwordStrength(value) : null;

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-(--text-2) mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className="w-full h-11 px-4 pr-11 rounded-xl border border-(--border) bg-(--bg-surface)
            text-(--text-1) text-sm placeholder:text-(--text-4)
            focus:outline-none focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20
            disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        />
        <button
          type="button"
          onClick={() => setVisible((p) => !p)}
          disabled={disabled}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-(--text-4) hover:text-(--text-1) transition-colors"
        >
          {visible ? (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
            </svg>
          ) : (
            <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>

      {/* Strength meter */}
      {showStrength && value && strength && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  i < strength.score ? strength.color : "bg-(--bg-sunken)"
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-(--text-4)">{strength.label}</p>
        </div>
      )}
    </div>
  );
}
