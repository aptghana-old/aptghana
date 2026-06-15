"use client";

import type { MeiliTypoTolerance } from "@apt/types";
import { TagListEditor } from "./TagListEditor";

interface TypoToleranceEditorProps {
  value: MeiliTypoTolerance;
  onChange: (value: MeiliTypoTolerance) => void;
}

export function TypoToleranceEditor({ value, onChange }: TypoToleranceEditorProps) {
  const set = <K extends keyof MeiliTypoTolerance>(key: K, val: MeiliTypoTolerance[K]) =>
    onChange({ ...value, [key]: val });

  return (
    <div className="flex flex-col gap-5 max-w-xl">
      {/* Enabled toggle */}
      <label className="flex items-center justify-between gap-4 p-4 rounded-lg cursor-pointer border" style={{ borderColor: "var(--apt-border)", background: "var(--apt-bg)" }}>
        <div>
          <p className="text-[13px] font-medium" style={{ color: "var(--apt-text-primary)" }}>Enable Typo Tolerance</p>
          <p className="text-[12px] mt-0.5" style={{ color: "var(--apt-text-muted)" }}>
            Allow minor spelling mistakes to still return relevant results.
          </p>
        </div>
        <div
          onClick={() => set("enabled", !value.enabled)}
          className="relative inline-flex h-6 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
          style={{ background: value.enabled ? "#0057b8" : "var(--apt-bg-raised)" }}
        >
          <span
            className="pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform"
            style={{ transform: value.enabled ? "translateX(16px)" : "translateX(0)" }}
          />
        </div>
      </label>

      {value.enabled && (
        <>
          {/* Min word size thresholds */}
          <div className="card p-4 flex flex-col gap-4">
            <h3 className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
              Minimum Word Length for Typos
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                  1 typo allowed (characters)
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={value.minWordSizeForTypos.oneTypo}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      minWordSizeForTypos: {
                        ...value.minWordSizeForTypos,
                        oneTypo: Math.max(1, parseInt(e.target.value) || 1),
                      },
                    })
                  }
                  className="h-9 px-3 rounded-md text-[13px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                  style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
                />
                <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                  Words with ≥ this many characters can have 1 typo
                </p>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                  2 typos allowed (characters)
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={value.minWordSizeForTypos.twoTypos}
                  onChange={(e) =>
                    onChange({
                      ...value,
                      minWordSizeForTypos: {
                        ...value.minWordSizeForTypos,
                        twoTypos: Math.max(1, parseInt(e.target.value) || 1),
                      },
                    })
                  }
                  className="h-9 px-3 rounded-md text-[13px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                  style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
                />
                <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                  Words with ≥ this many characters can have 2 typos
                </p>
              </div>
            </div>
          </div>

          {/* Disabled words */}
          <TagListEditor
            label="Disable Typo Tolerance on Words"
            hint="Exact spelling required for these words (useful for product codes, SKUs)"
            values={value.disableOnWords ?? []}
            onChange={(v) => set("disableOnWords", v)}
            placeholder="e.g. iphone, SKU123…"
            mono
          />

          {/* Disabled attributes */}
          <TagListEditor
            label="Disable Typo Tolerance on Attributes"
            hint="Typo tolerance disabled when matching in these attribute paths"
            values={value.disableOnAttributes ?? []}
            onChange={(v) => set("disableOnAttributes", v)}
            placeholder="e.g. sku, mpn…"
            mono
          />
        </>
      )}
    </div>
  );
}
