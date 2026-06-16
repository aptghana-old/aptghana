"use client";

import { useState } from "react";
import { StickyNote, Send, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export interface Note {
  _id: string;
  body: string;
  authorName?: string;
  createdAt: string;
}

interface Props {
  customerId: string;
  initialNotes: Note[];
  canAdd: boolean;
}

export default function NotesPanel({ customerId, initialNotes, canAdd }: Props) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addNote() {
    const text = body.trim();
    if (!text) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${customerId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to add note");
        return;
      }
      setNotes((prev) => [json.note, ...prev]);
      setBody("");
    } catch {
      setError("Failed to add note");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="card p-5 space-y-4">
      <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--apt-text-muted)" }}>
        <StickyNote size={12} /> Internal Notes — staff only
      </p>

      {canAdd && (
        <div className="space-y-2">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add an internal note about this customer…"
            rows={3}
          />
          <div className="flex items-center justify-between">
            {error && <p className="text-[11px] text-[#dc2626]">{error}</p>}
            <Button
              variant="primary" size="sm" className="ml-auto"
              onClick={addNote} disabled={sending || !body.trim()}
              icon={sending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            >
              Add note
            </Button>
          </div>
        </div>
      )}

      {notes.length === 0 ? (
        <p className="text-[12px]" style={{ color: "var(--apt-text-muted)" }}>No internal notes yet.</p>
      ) : (
        <ol className="space-y-3">
          {notes.map((n) => (
            <li key={n._id} className="p-3 rounded-md" style={{ background: "var(--apt-bg-raised)" }}>
              <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--apt-text-secondary)" }}>{n.body}</p>
              <p className="text-[11px] mt-1.5" style={{ color: "var(--apt-text-muted)" }}>
                {n.authorName ?? "Admin"} · {new Date(n.createdAt).toLocaleString("en-GH")}
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
