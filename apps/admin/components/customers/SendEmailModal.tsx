"use client";

import { useState } from "react";
import { X, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select } from "@/components/ui/Input";

interface Props {
  customer: { id: string; name: string; email: string };
  onClose(): void;
}

const TYPE_OPTIONS = [
  { value: "info", label: "Info" },
  { value: "success", label: "Success" },
  { value: "warning", label: "Warning" },
  { value: "alert", label: "Alert" },
];

export default function SendEmailModal({ customer, onClose }: Props) {
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send() {
    setError(null);
    if (!subject.trim() || !body.trim()) {
      setError("Subject and message are required");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/customers/${customer.id}/email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, title: title || subject, body, type }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to send email");
        return;
      }
      setSent(true);
      setTimeout(onClose, 1200);
    } catch {
      setError("Failed to send email");
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "var(--apt-bg-overlay)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-xl overflow-hidden"
        style={{ background: "var(--apt-bg)", border: "1px solid var(--apt-border-strong)", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}
        role="dialog"
        aria-label="Send email"
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--apt-border)" }}>
          <div className="flex items-center gap-2.5">
            <Mail size={15} style={{ color: "var(--apt-text-brand)" }} />
            <div>
              <p className="text-[14px] font-semibold" style={{ color: "var(--apt-text-primary)" }}>Send email</p>
              <p className="text-[11px]" style={{ color: "var(--apt-text-muted)" }}>To {customer.name} &lt;{customer.email}&gt;</p>
            </div>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded flex items-center justify-center hover:bg-[var(--apt-bg-raised)]" style={{ color: "var(--apt-text-muted)" }}>
            <X size={14} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <Input label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject line" required />
          <Input label="Heading" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defaults to subject" />
          <Textarea label="Message" value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" required rows={5} />
          <Select label="Tone" options={TYPE_OPTIONS} value={type} onChange={(e) => setType(e.target.value)} />
          {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
          {sent && <p className="text-[12px]" style={{ color: "#15803d" }}>Email sent.</p>}
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4" style={{ borderTop: "1px solid var(--apt-border)" }}>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={send} disabled={sending || sent} icon={sending ? <Loader2 size={13} className="animate-spin" /> : undefined}>
            {sending ? "Sending…" : "Send email"}
          </Button>
        </div>
      </div>
    </div>
  );
}
