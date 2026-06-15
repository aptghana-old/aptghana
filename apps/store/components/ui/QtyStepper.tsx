"use client";

interface QtyStepperProps {
  qty: number;
  minQty?: number;
  onChange: (qty: number) => void;
  /** Called when decrementing below minQty (e.g. remove the row). Omit to clamp at minQty. */
  onBelowMin?: () => void;
  size?: "sm" | "md";
  label?: string;
}

export default function QtyStepper({
  qty,
  minQty = 1,
  onChange,
  onBelowMin,
  size = "md",
  label = "Quantity",
}: QtyStepperProps) {
  const btn  = size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const cell = size === "sm" ? "w-10 h-7 text-[13px]" : "w-12 h-8 text-sm";

  function decrement() {
    if (qty <= minQty) {
      onBelowMin?.();
      return;
    }
    onChange(qty - 1);
  }

  return (
    <div
      className="inline-flex items-center rounded-lg border overflow-hidden"
      style={{ borderColor: "var(--border)", background: "var(--bg-surface)" }}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={decrement}
        disabled={qty <= minQty && !onBelowMin}
        aria-label="Decrease quantity"
        className={`${btn} flex items-center justify-center text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-raised) disabled:opacity-30 disabled:hover:bg-transparent transition-colors`}
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
          <path d="M19.5 12h-15" />
        </svg>
      </button>
      <input
        type="number"
        inputMode="numeric"
        value={qty}
        min={minQty}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10);
          if (!Number.isNaN(n)) onChange(Math.max(minQty, n));
        }}
        aria-label={label}
        className={`${cell} text-center font-bold text-(--text-1) bg-transparent border-x focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
        style={{ borderColor: "var(--border)" }}
      />
      <button
        type="button"
        onClick={() => onChange(qty + 1)}
        aria-label="Increase quantity"
        className={`${btn} flex items-center justify-center text-(--text-3) hover:text-(--text-1) hover:bg-(--bg-raised) transition-colors`}
      >
        <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" aria-hidden>
          <path d="M12 4.5v15m7.5-7.5h-15" />
        </svg>
      </button>
    </div>
  );
}
