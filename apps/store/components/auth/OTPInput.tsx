"use client";

import { useRef, useCallback, type ClipboardEvent, type KeyboardEvent } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (val: string) => void;
  autoFocus?: boolean;
  disabled?: boolean;
}

export default function OTPInput({
  length = 6, value, onChange, autoFocus = false, disabled = false,
}: OTPInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const digits = value.split("").concat(Array(length).fill("")).slice(0, length);

  const focusAt = useCallback((i: number) => {
    refs.current[Math.min(Math.max(i, 0), length - 1)]?.focus();
  }, [length]);

  const handleInput = useCallback((i: number, v: string) => {
    const char = v.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, j) => (j === i ? char : d)).join("");
    onChange(next);
    if (char && i < length - 1) focusAt(i + 1);
  }, [digits, length, onChange, focusAt]);

  const handleKeyDown = useCallback((i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (digits[i]) {
        const next = digits.map((d, j) => (j === i ? "" : d)).join("");
        onChange(next);
      } else {
        focusAt(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault(); focusAt(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault(); focusAt(i + 1);
    }
  }, [digits, onChange, focusAt]);

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
    onChange(pasted.padEnd(digits.join("").length > 0 ? digits.join("").length : 0, "").slice(0, length));
    onChange(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  }, [length, digits, onChange, focusAt]);

  return (
    <div className="flex items-center gap-2.5 justify-center" role="group" aria-label="One-time password input">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={d}
          autoFocus={autoFocus && i === 0}
          disabled={disabled}
          aria-label={`Digit ${i + 1}`}
          className={`w-11 h-12 text-center text-lg font-bold rounded-xl border transition-all outline-none
            bg-(--bg-surface) text-(--text-1)
            ${d ? "border-navy-500 ring-2 ring-navy-500/20" : "border-(--border)"}
            focus:border-navy-500 focus:ring-2 focus:ring-navy-500/20
            disabled:opacity-50 disabled:cursor-not-allowed`}
          onChange={(e) => handleInput(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          autoComplete={i === 0 ? "one-time-code" : "off"}
        />
      ))}
    </div>
  );
}
