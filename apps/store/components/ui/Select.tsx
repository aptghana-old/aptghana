"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export interface SelectOption {
  value: string;
  label: string;
  /** Optional muted second line shown under the label */
  description?: string;
}

interface SelectProps {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Accessible name, e.g. "Sort by" */
  label: string;
  /** Muted inline prefix shown before the selected label, e.g. "Sort" */
  prefix?: string;
  /** Which edge of the trigger the menu aligns to */
  align?: "start" | "end";
  className?: string;
}

export default function Select({
  value,
  options,
  onChange,
  label,
  prefix,
  align = "start",
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const baseId = useId();

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = options[selectedIndex];
  const listboxId = `${baseId}-listbox`;
  const optionId = (i: number) => `${baseId}-option-${i}`;

  function openMenu() {
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    setOpen(true);
  }

  function closeMenu() {
    setOpen(false);
    setActiveIndex(-1);
  }

  function commit(index: number) {
    const option = options[index];
    if (option && option.value !== value) onChange(option.value);
    closeMenu();
  }

  /* Close on outside pointer interaction */
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      if (!rootRef.current?.contains(e.target as Node)) closeMenu();
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  /* Keep the active option in view while navigating with the keyboard */
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    listRef.current
      ?.querySelector(`#${CSS.escape(optionId(activeIndex))}`)
      ?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activeIndex]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (!open) {
      if (["Enter", " ", "ArrowDown", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        openMenu();
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, options.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Home":
        e.preventDefault();
        setActiveIndex(0);
        break;
      case "End":
        e.preventDefault();
        setActiveIndex(options.length - 1);
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        commit(activeIndex);
        break;
      case "Escape":
        e.preventDefault();
        closeMenu();
        break;
      case "Tab":
        closeMenu();
        break;
    }
  }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        role="combobox"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
        onClick={() => (open ? closeMenu() : openMenu())}
        onKeyDown={onKeyDown}
        className="group flex items-center gap-2 h-8 pl-3 pr-2.5 rounded-lg text-[13px] cursor-pointer select-none transition-colors border focus:outline-none"
        style={{
          background: "var(--bg-surface)",
          borderColor: open ? "var(--border-hi)" : "var(--border)",
          color: "var(--text-2)",
        }}
      >
        {prefix && <span className="text-(--text-4)">{prefix}</span>}
        <span className="font-medium text-(--text-2) truncate">
          {selected?.label ?? value}
        </span>
        <svg
          width={12}
          height={12}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`shrink-0 text-(--text-4) transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-label={label}
          className={`absolute z-50 mt-1.5 min-w-full w-max max-h-72 overflow-auto rounded-xl p-1 ${align === "end" ? "right-0" : "left-0"}`}
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-3)",
            animation: "fade-up .16s cubic-bezier(.16,1,.3,1) both",
          }}
        >
          {options.map((option, i) => {
            const isSelected = i === selectedIndex;
            const isActive = i === activeIndex;
            return (
              <li
                key={option.value}
                id={optionId(i)}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => commit(i)}
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] cursor-pointer transition-colors"
                style={{
                  background: isActive ? "var(--bg-raised)" : "transparent",
                  color: isSelected ? "var(--text-1)" : "var(--text-2)",
                }}
              >
                <span className={`flex-1 truncate ${isSelected ? "font-semibold" : ""}`}>
                  {option.label}
                  {option.description && (
                    <span className="block text-[11px] font-normal text-(--text-4)">
                      {option.description}
                    </span>
                  )}
                </span>
                <svg
                  width={14}
                  height={14}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                  className={`shrink-0 text-navy-500 dark:text-navy-300 transition-opacity ${isSelected ? "opacity-100" : "opacity-0"}`}
                >
                  <path d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
