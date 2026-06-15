"use client";

import { useRef, useState } from "react";
import { Icon } from "@/components/account/ui";
import type { DraftAttachment } from "@/lib/store/request-draft";
import { Card, D } from "./icons";

const MAX_FILES = 5;
const MAX_SIZE_MB = 4;
const ACCEPT = ".pdf,.png,.jpg,.jpeg,.webp,.xlsx,.xls,.docx,.doc,.csv";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

interface AttachmentUploaderProps {
  attachments: DraftAttachment[];
  onAdd: (attachment: DraftAttachment) => void;
  onRemove: (id: string) => void;
}

/** Supporting documents (datasheets, spec sheets, drawings) for RFQs. */
export default function AttachmentUploader({ attachments, onAdd, onRemove }: AttachmentUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);

    for (const file of Array.from(files)) {
      if (attachments.length >= MAX_FILES) {
        setError(`Maximum ${MAX_FILES} documents per request.`);
        break;
      }
      if (file.size > MAX_SIZE_MB * 1024 * 1024) {
        setError(`"${file.name}" exceeds the ${MAX_SIZE_MB} MB limit.`);
        continue;
      }

      setUploading(true);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/rfq/attachments", { method: "POST", body: form });
        const data = (await res.json()) as {
          id?: string; name?: string; size?: number; contentType?: string; error?: string;
        };
        if (!res.ok || !data.id) {
          setError(data.error ?? `Failed to upload "${file.name}".`);
          continue;
        }
        onAdd({ id: data.id, name: data.name ?? file.name, size: data.size ?? file.size, contentType: data.contentType ?? file.type });
      } catch {
        setError(`Network error while uploading "${file.name}".`);
      } finally {
        setUploading(false);
      }
    }
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Card
      title="Supporting Documents"
      subtitle={`Datasheets, drawings, BOQs, or photos — up to ${MAX_FILES} files, ${MAX_SIZE_MB} MB each.`}
    >
      <div className="p-5 sm:p-6 space-y-3">
        {attachments.length > 0 && (
          <ul className="space-y-2">
            {attachments.map((a) => (
              <li
                key={a.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border"
                style={{ background: "var(--bg-raised)", borderColor: "var(--border)" }}
              >
                <Icon d={D.paperclip} size={15} className="shrink-0 text-(--text-3)" />
                <span className="flex-1 min-w-0 text-[13px] font-medium text-(--text-1) truncate">{a.name}</span>
                <span className="text-[11px] text-(--text-4) shrink-0">{fmtSize(a.size)}</span>
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  aria-label={`Remove ${a.name}`}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-(--text-4) hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
                >
                  <Icon d={D.close} size={12} strokeWidth={2.5} />
                </button>
              </li>
            ))}
          </ul>
        )}

        {attachments.length < MAX_FILES && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-dashed text-sm font-semibold text-(--text-3) hover:text-navy-500 hover:border-navy-400 disabled:opacity-60 transition-colors"
            style={{ borderColor: "var(--border-hi)" }}
          >
            {uploading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon d={D.paperclip} size={15} strokeWidth={2} />
            )}
            {uploading ? "Uploading…" : "Attach documents"}
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={(e) => handleFiles(e.target.files)}
          className="hidden"
          aria-label="Upload supporting documents"
        />

        {error && (
          <p className="text-[12px] text-red-600 dark:text-red-400" role="alert">{error}</p>
        )}
      </div>
    </Card>
  );
}
