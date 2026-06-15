"use client";

import { useCallback, useEffect, useReducer, useRef } from "react";
import {
  CheckCircle2, AlertCircle, Save, Zap, History, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SynonymEditor }        from "./SynonymEditor";
import { AttributeList }        from "./AttributeList";
import { TagListEditor }        from "./TagListEditor";
import { RankingEditor }        from "./RankingEditor";
import { TypoToleranceEditor }  from "./TypoToleranceEditor";
import { FacetingEditor }       from "./FacetingEditor";
import { ImportExportBar }      from "./ImportExportBar";
import type { MeiliSettings, SearchIndexName } from "@apt/types";
import { SEARCH_INDEX_LABELS } from "@apt/types";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab =
  | "attributes"
  | "ranking"
  | "synonyms"
  | "stopwords"
  | "typo"
  | "faceting"
  | "dictionary"
  | "advanced";

const TABS: { id: Tab; label: string }[] = [
  { id: "attributes", label: "Attributes" },
  { id: "ranking",    label: "Ranking Rules" },
  { id: "synonyms",   label: "Synonyms" },
  { id: "stopwords",  label: "Stop Words" },
  { id: "typo",       label: "Typo Tolerance" },
  { id: "faceting",   label: "Faceting & Pagination" },
  { id: "dictionary", label: "Dictionary" },
  { id: "advanced",   label: "Advanced" },
];

interface EditorState {
  settings:  MeiliSettings;
  isDirty:   boolean;
  note:      string;
  tab:       Tab;
  saveMode:  "draft" | "apply" | null;
  status:    "idle" | "loading" | "saving" | "ok" | "error";
  message:   string;
  liveMatch: boolean | null;
}

type Action =
  | { type: "SET_SETTINGS"; payload: Partial<MeiliSettings> }
  | { type: "SET_TAB"; payload: Tab }
  | { type: "SET_NOTE"; payload: string }
  | { type: "SET_STATUS"; payload: Pick<EditorState, "status" | "message"> }
  | { type: "RESET"; payload: MeiliSettings }
  | { type: "IMPORT"; payload: { settings: MeiliSettings; note: string } }
  | { type: "LIVE_MATCH"; payload: boolean | null };

function reducer(state: EditorState, action: Action): EditorState {
  switch (action.type) {
    case "SET_SETTINGS":
      return { ...state, settings: { ...state.settings, ...action.payload }, isDirty: true };
    case "SET_TAB":
      return { ...state, tab: action.payload };
    case "SET_NOTE":
      return { ...state, note: action.payload };
    case "SET_STATUS":
      return { ...state, ...action.payload, saveMode: null };
    case "RESET":
      return { ...state, settings: action.payload, isDirty: false, note: "", status: "idle", message: "" };
    case "IMPORT":
      return { ...state, settings: action.payload.settings, isDirty: true, note: action.payload.note };
    case "LIVE_MATCH":
      return { ...state, liveMatch: action.payload };
    default:
      return state;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SearchSettingsEditorProps {
  index:          SearchIndexName;
  initialSettings: MeiliSettings;
  activeVersionId: string | null;
  versionCount:   number;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SearchSettingsEditor({
  index,
  initialSettings,
  activeVersionId,
  versionCount,
}: SearchSettingsEditorProps) {
  const [state, dispatch] = useReducer(reducer, {
    settings:  initialSettings,
    isDirty:   false,
    note:      "",
    tab:       "attributes",
    saveMode:  null,
    status:    "idle",
    message:   "",
    liveMatch: null,
  });

  const noteRef = useRef<HTMLInputElement>(null);

  // Check if live Meilisearch state matches DB config on mount
  useEffect(() => {
    fetch(`/api/search/settings/${index}`)
      .then((r) => r.json())
      .then((data) => {
        const live = data.liveSettings as MeiliSettings | null;
        if (!live) { dispatch({ type: "LIVE_MATCH", payload: null }); return; }
        // Compare key counts as a fast approximate check
        const dbKeys  = initialSettings.searchableAttributes.join(",");
        const liveKeys = live.searchableAttributes.join(",");
        dispatch({ type: "LIVE_MATCH", payload: dbKeys === liveKeys });
      })
      .catch(() => dispatch({ type: "LIVE_MATCH", payload: null }));
  }, [index, initialSettings]);

  const setField = useCallback(
    <K extends keyof MeiliSettings>(key: K) =>
      (val: MeiliSettings[K]) =>
        dispatch({ type: "SET_SETTINGS", payload: { [key]: val } }),
    [],
  );

  const save = async (apply: boolean) => {
    dispatch({ type: "SET_STATUS", payload: { status: "saving", message: apply ? "Applying to Meilisearch…" : "Saving draft…" } });
    try {
      const res = await fetch(`/api/search/settings/${index}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ settings: state.settings, note: state.note, apply }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      dispatch({
        type:    "SET_STATUS",
        payload: {
          status:  "ok",
          message: apply
            ? `v${data.config.version} applied to Meilisearch successfully.`
            : `Draft v${data.config.version} saved.`,
        },
      });
      dispatch({ type: "RESET", payload: state.settings });
    } catch (err) {
      dispatch({ type: "SET_STATUS", payload: { status: "error", message: String(err) } });
    }
  };

  const reApplyCurrent = async () => {
    if (!activeVersionId) return;
    dispatch({ type: "SET_STATUS", payload: { status: "saving", message: "Re-applying current config to Meilisearch…" } });
    try {
      const res  = await fetch(`/api/search/settings/${index}/versions/${activeVersionId}/apply`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Apply failed");
      dispatch({ type: "SET_STATUS", payload: { status: "ok", message: "Config re-applied to Meilisearch." } });
      dispatch({ type: "LIVE_MATCH", payload: true });
    } catch (err) {
      dispatch({ type: "SET_STATUS", payload: { status: "error", message: String(err) } });
    }
  };

  const { settings, isDirty, note, tab, status, message, liveMatch } = state;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ────────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {/* Live-match badge */}
        {liveMatch === false && (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px]"
            style={{ background: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}
          >
            <AlertCircle size={13} className="shrink-0" />
            DB config differs from live Meilisearch state.
            <button
              type="button"
              onClick={reApplyCurrent}
              className="underline font-medium ml-1"
            >
              Re-apply
            </button>
          </div>
        )}
        {liveMatch === true && (
          <div className="flex items-center gap-1.5 text-[12px]" style={{ color: "#166534" }}>
            <CheckCircle2 size={13} />
            In sync with Meilisearch
          </div>
        )}

        <div className="flex-1" />

        <ImportExportBar
          index={index}
          versionId={activeVersionId ?? undefined}
          onImported={(s, n) => dispatch({ type: "IMPORT", payload: { settings: s, note: n } })}
        />

        <a
          href={`/dashboard/search/history?index=${index}`}
          className="flex items-center gap-1.5 text-[12px] h-8 px-3 rounded-md border transition-colors hover:bg-[var(--apt-bg-raised)]"
          style={{ borderColor: "var(--apt-border)", color: "var(--apt-text-secondary)" }}
        >
          <History size={12} />
          {versionCount} version{versionCount !== 1 ? "s" : ""}
        </a>
      </div>

      {/* ── Status bar ─────────────────────────────────────────────────────────── */}
      {status !== "idle" && (
        <div
          className="flex items-center gap-2 px-6 py-2.5 text-[12px] shrink-0"
          style={{
            background: status === "ok" ? "#f0fdf4" : status === "error" ? "#fef2f2" : "#eff6ff",
            color:      status === "ok" ? "#166534" : status === "error" ? "#991b1b" : "#1d4ed8",
            borderBottom: "1px solid var(--apt-border)",
          }}
        >
          {status === "saving" && <Loader2 size={13} className="animate-spin shrink-0" />}
          {status === "ok"     && <CheckCircle2 size={13} className="shrink-0" />}
          {status === "error"  && <AlertCircle  size={13} className="shrink-0" />}
          {message}
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0.5 px-6 py-2 overflow-x-auto shrink-0"
        style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => dispatch({ type: "SET_TAB", payload: t.id })}
            className="px-3 py-1.5 rounded-md text-[12px] font-medium whitespace-nowrap transition-colors"
            style={{
              background: tab === t.id ? "#0057b8" : "transparent",
              color:      tab === t.id ? "#fff"    : "var(--apt-text-secondary)",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Main editor area ───────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-6">
        {tab === "attributes" && (
          <div className="grid grid-cols-3 gap-6">
            <AttributeList
              label="Searchable Attributes"
              hint="Order determines relevance weight — first attribute has highest weight."
              values={settings.searchableAttributes}
              onChange={setField("searchableAttributes")}
            />
            <AttributeList
              label="Filterable Attributes"
              hint="Must include every attribute you filter or facet on."
              values={settings.filterableAttributes}
              onChange={setField("filterableAttributes")}
            />
            <AttributeList
              label="Sortable Attributes"
              hint="Attributes users can sort by (e.g. price, name)."
              values={settings.sortableAttributes}
              onChange={setField("sortableAttributes")}
            />
          </div>
        )}

        {tab === "ranking" && (
          <div className="max-w-2xl">
            <RankingEditor
              rules={settings.rankingRules}
              onChange={setField("rankingRules")}
            />
          </div>
        )}

        {tab === "synonyms" && (
          <SynonymEditor
            synonyms={settings.synonyms}
            onChange={setField("synonyms")}
          />
        )}

        {tab === "stopwords" && (
          <div className="max-w-xl">
            <TagListEditor
              label="Stop Words"
              hint="Common words ignored during search (e.g. 'the', 'a', 'for'). Enter and press Enter or comma."
              values={settings.stopWords}
              onChange={setField("stopWords")}
              placeholder="the, a, for, and…"
            />
          </div>
        )}

        {tab === "typo" && (
          <TypoToleranceEditor
            value={settings.typoTolerance}
            onChange={setField("typoTolerance")}
          />
        )}

        {tab === "faceting" && (
          <FacetingEditor
            faceting={settings.faceting}
            pagination={settings.pagination}
            onChangeFaceting={setField("faceting")}
            onChangePagination={setField("pagination")}
          />
        )}

        {tab === "dictionary" && (
          <div className="max-w-xl">
            <TagListEditor
              label="Custom Dictionary"
              hint="Words that Meilisearch should never split during tokenisation (compound terms, brand names, etc.)"
              values={settings.dictionary}
              onChange={setField("dictionary")}
              placeholder="e.g. wi-fi, e-mail, rs485…"
              mono
            />
          </div>
        )}

        {tab === "advanced" && (
          <div className="max-w-xl flex flex-col gap-6">
            {/* Distinct attribute */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium" style={{ color: "var(--apt-text-primary)" }}>
                Distinct Attribute
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={settings.distinctAttribute ?? ""}
                  onChange={(e) =>
                    setField("distinctAttribute")(e.target.value || null)
                  }
                  placeholder="sku"
                  className="h-9 w-64 px-3 rounded-md text-[13px] font-mono border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
                  style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
                />
                {settings.distinctAttribute && (
                  <button
                    type="button"
                    onClick={() => setField("distinctAttribute")(null)}
                    className="text-[11px] underline"
                    style={{ color: "#dc2626" }}
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>
                Prevents duplicate results — only the best document per distinct value is returned.
              </p>
            </div>

            <TagListEditor
              label="Separator Tokens"
              hint="Characters treated as word separators in addition to the defaults"
              values={settings.separatorTokens}
              onChange={setField("separatorTokens")}
              placeholder=". / - …"
              mono
            />

            <TagListEditor
              label="Non-Separator Tokens"
              hint="Characters NOT treated as word separators (override defaults)"
              values={settings.nonSeparatorTokens}
              onChange={setField("nonSeparatorTokens")}
              placeholder="# @ …"
              mono
            />
          </div>
        )}
      </div>

      {/* ── Footer: save bar ───────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-3 px-6 py-3 shrink-0"
        style={{ borderTop: "1px solid var(--apt-border)", background: "var(--apt-bg)" }}
      >
        {isDirty && (
          <span className="text-[12px] font-medium" style={{ color: "#d97706" }}>
            Unsaved changes
          </span>
        )}

        <input
          ref={noteRef}
          value={note}
          onChange={(e) => dispatch({ type: "SET_NOTE", payload: e.target.value })}
          placeholder="Describe this change (optional)…"
          className="flex-1 h-8 px-3 rounded-md text-[12px] border focus:outline-none focus:ring-2 focus:ring-[var(--apt-border-focus)]"
          style={{ background: "var(--apt-bg)", borderColor: "var(--apt-border)", color: "var(--apt-text-primary)" }}
        />

        <Button
          variant="secondary"
          size="sm"
          icon={<Save size={12} />}
          onClick={() => save(false)}
          loading={status === "saving"}
          disabled={!isDirty || status === "saving"}
        >
          Save Draft
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Zap size={12} />}
          onClick={() => save(true)}
          loading={status === "saving"}
          disabled={!isDirty || status === "saving"}
        >
          Save & Apply
        </Button>
      </div>
    </div>
  );
}
