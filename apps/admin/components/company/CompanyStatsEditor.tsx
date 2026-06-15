"use client";

import { useState } from "react";
import { Plus, Trash2, Pencil, Check, X } from "lucide-react";

interface Stat {
  _id:          string;
  value:        string;
  label:        string;
  displayOrder: number;
  status:       string;
}

interface Props { initialStats: Stat[] }

export default function CompanyStatsEditor({ initialStats }: Props) {
  const [stats, setStats]   = useState<Stat[]>(initialStats);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBuf, setEditBuf] = useState<Pick<Stat, "value" | "label" | "displayOrder">>({
    value: "", label: "", displayOrder: 0,
  });
  const [newBuf, setNewBuf] = useState<Pick<Stat, "value" | "label" | "displayOrder">>({
    value: "", label: "", displayOrder: 0,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [error, setError]    = useState<string | null>(null);
  const [saving, setSaving]  = useState(false);

  const startEdit = (s: Stat) => {
    setEditId(s._id);
    setEditBuf({ value: s.value, label: s.label, displayOrder: s.displayOrder });
    setError(null);
  };

  const cancelEdit = () => { setEditId(null); setError(null); };

  const saveEdit = async (id: string) => {
    if (!editBuf.value.trim() || !editBuf.label.trim()) {
      setError("Value and label are required."); return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/company/stats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editBuf),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      setStats((prev) => prev.map((s) => s._id === id ? { ...s, ...editBuf } : s));
      setEditId(null);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteStat = async (id: string) => {
    if (!confirm("Delete this stat?")) return;
    try {
      const res = await fetch(`/api/company/stats/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      setStats((prev) => prev.filter((s) => s._id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const addStat = async () => {
    if (!newBuf.value.trim() || !newBuf.label.trim()) {
      setError("Value and label are required."); return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/company/stats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...newBuf, status: "active" }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Create failed");
      const { id } = await res.json();
      setStats((prev) => [...prev, { _id: id, ...newBuf, status: "active" }]);
      setNewBuf({ value: "", label: "", displayOrder: 0 });
      setAddOpen(false);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="px-3 py-2 rounded-lg text-[12px]" style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c" }}>
          {error}
        </div>
      )}

      <div className="space-y-2">
        {stats.map((s) => (
          <div
            key={s._id}
            className="rounded-lg px-3 py-2.5"
            style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
          >
            {editId === s._id ? (
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <input
                  className="h-8 px-2 rounded-md text-[13px] w-24"
                  style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                  value={editBuf.value}
                  onChange={(e) => setEditBuf((b) => ({ ...b, value: e.target.value }))}
                  placeholder="Value"
                />
                <input
                  className="h-8 px-2 rounded-md text-[13px] flex-1"
                  style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                  value={editBuf.label}
                  onChange={(e) => setEditBuf((b) => ({ ...b, label: e.target.value }))}
                  placeholder="Label"
                />
                <input
                  className="h-8 px-2 rounded-md text-[12px] w-16"
                  type="number"
                  style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
                  value={editBuf.displayOrder}
                  onChange={(e) => setEditBuf((b) => ({ ...b, displayOrder: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="Order"
                />
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => saveEdit(s._id)} disabled={saving}
                    className="p-1.5 rounded-md text-green-600 hover:bg-green-50 transition-colors disabled:opacity-50"
                  >
                    <Check size={14} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span
                  className="font-extrabold text-lg w-16 shrink-0"
                  style={{ color: "#84CC16", fontFamily: "var(--font-sora, 'Sora', sans-serif)" }}
                >
                  {s.value}
                </span>
                <span className="text-[13px] flex-1" style={{ color: "var(--apt-text-secondary)" }}>
                  {s.label}
                </span>
                <span className="text-[11px] w-8 text-center" style={{ color: "var(--apt-text-muted)" }}>
                  #{s.displayOrder}
                </span>
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => startEdit(s)}
                    className="p-1.5 rounded-md transition-colors"
                    style={{ color: "var(--apt-text-muted)" }}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => deleteStat(s._id)}
                    className="p-1.5 rounded-md text-red-400 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {addOpen ? (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "var(--apt-bg-raised)", border: "1px solid var(--apt-border)" }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
            New Stat
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="h-8 px-2 rounded-md text-[13px] w-24"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              value={newBuf.value}
              onChange={(e) => setNewBuf((b) => ({ ...b, value: e.target.value }))}
              placeholder="e.g. 2009"
            />
            <input
              className="h-8 px-2 rounded-md text-[13px] flex-1"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              value={newBuf.label}
              onChange={(e) => setNewBuf((b) => ({ ...b, label: e.target.value }))}
              placeholder="e.g. Year Founded"
            />
            <input
              className="h-8 px-2 rounded-md text-[12px] w-16"
              type="number"
              style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border)", color: "var(--apt-text-primary)" }}
              value={newBuf.displayOrder}
              onChange={(e) => setNewBuf((b) => ({ ...b, displayOrder: parseInt(e.target.value, 10) || 0 }))}
              placeholder="0"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={addStat} disabled={saving}
              className="h-7 px-3 rounded-md text-[12px] font-semibold bg-[#0057b8] text-white hover:bg-[#0046a0] transition-colors disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => { setAddOpen(false); setError(null); }}
              className="h-7 px-3 rounded-md text-[12px]"
              style={{ color: "var(--apt-text-muted)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded-md transition-colors"
          style={{ color: "var(--apt-text-muted)", border: "1px dashed var(--apt-border)" }}
        >
          <Plus size={12} />
          Add Stat
        </button>
      )}
    </div>
  );
}
