"use client";

import { useEffect, useRef } from "react";
import { useCompare, COMPARE_MAX } from "@/lib/store/compare";

function XIcon() {
  return (
    <svg width={10} height={10} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" aria-hidden>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function ScalesIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v18M3 9l9-6 9 6M3 15l9 6 9-6M3 9h18M3 15h18" />
    </svg>
  );
}

export default function CompareBar() {
  const { items, count, clear, remove, openModal } = useCompare();
  const prevCount = useRef(0);

  useEffect(() => { prevCount.current = count; }, [count]);

  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Product comparison"
      className="fixed bottom-0 inset-x-0 z-[90] animate-fade-up"
      style={{ animationDuration: "220ms" }}
    >
      {/* Bar */}
      <div
        className="glass border-t"
        style={{
          background:  "color-mix(in srgb, var(--bg-surface) 88%, transparent)",
          borderColor: "var(--border-hi)",
          boxShadow:   "var(--shadow-3)",
        }}
      >
        <div className="container-store">
          <div className="flex items-center gap-3 py-3 sm:py-3.5">

            {/* Label */}
            <div className="flex items-center gap-2 shrink-0 mr-1">
              <span className="hidden sm:flex w-7 h-7 rounded-lg items-center justify-center bg-navy-500/10 text-navy-500">
                <ScalesIcon />
              </span>
              <div className="hidden sm:block">
                <p className="text-[11px] font-bold text-(--text-4) uppercase tracking-wider leading-none mb-0.5">
                  Compare
                </p>
                <p className="text-sm font-bold text-(--text-1) leading-none">
                  {count} / {COMPARE_MAX}
                </p>
              </div>
              <span className="sm:hidden text-[11px] font-bold text-(--text-3)">
                Compare ({count}/{COMPARE_MAX})
              </span>
            </div>

            {/* Product chips */}
            <div className="flex items-center gap-2 flex-1 overflow-x-auto scrollbar-hide min-w-0">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="shrink-0 flex items-center gap-1.5 h-9 pl-1.5 pr-2 rounded-xl border"
                  style={{ background: "var(--bg-raised)", borderColor: "var(--border-hi)" }}
                >
                  {/* Thumbnail */}
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="w-7 h-7 object-contain rounded-lg bg-(--bg-surface) shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-lg bg-(--bg-surface) shrink-0" />
                  )}

                  {/* Name */}
                  <span className="text-xs font-semibold text-(--text-1) max-w-[120px] truncate hidden sm:block">
                    {item.name}
                  </span>

                  {/* Remove */}
                  <button
                    onClick={() => remove(item.id)}
                    aria-label={`Remove ${item.name} from compare`}
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-(--text-3) hover:bg-red-100 hover:text-red-500 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}

              {/* Empty slots */}
              {count < COMPARE_MAX && (
                <div
                  className="shrink-0 h-9 w-20 rounded-xl border border-dashed flex items-center justify-center text-(--text-4) text-xs hidden sm:flex"
                  style={{ borderColor: "var(--border-hi)" }}
                >
                  + Add
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 ml-1">
              <button
                onClick={clear}
                className="text-xs font-semibold text-(--text-3) hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                Clear
              </button>

              <button
                onClick={openModal}
                className="flex items-center gap-1.5 h-9 px-4 rounded-xl text-sm font-bold text-white transition-all active:scale-95"
                style={{ background: "#0057b8" }}
              >
                <ScalesIcon />
                <span className="hidden sm:inline">Compare {count > 1 ? `(${count})` : ""}</span>
                <span className="sm:hidden">Go</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
