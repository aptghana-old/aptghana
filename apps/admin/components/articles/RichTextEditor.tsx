"use client";

import { useCallback, useState } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import Placeholder from "@tiptap/extension-placeholder";
import Youtube from "@tiptap/extension-youtube";
import TextAlign from "@tiptap/extension-text-align";
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Quote, Code2, Link2,
  Image as ImageIcon, Table2, Film, MessageSquareWarning,
  Heading1, Heading2, Heading3, Undo2, Redo2, AlignLeft, AlignCenter, AlignRight,
} from "lucide-react";
import { MediaPicker } from "@/components/media/MediaPicker";
import type { Asset } from "@/components/media/types";
import { Callout } from "./CalloutExtension";

interface Props {
  value: string;
  onChange(html: string): void;
  placeholder?: string;
}

function ToolbarButton({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={active}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className="w-7 h-7 rounded-md flex items-center justify-center transition-colors"
      style={{ background: active ? "var(--apt-bg-raised)" : "transparent", color: active ? "var(--apt-text-brand)" : "var(--apt-text-secondary)" }}
    >
      {children}
    </button>
  );
}

function Toolbar({ editor, onPickImage }: { editor: Editor; onPickImage: () => void }) {
  const setLink = useCallback(() => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", prev ?? "https://");
    if (url === null) return;
    if (!url) { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  const insertVideo = useCallback(() => {
    const url = window.prompt("Video URL (YouTube)");
    if (!url) return;
    editor.commands.setYoutubeVideo({ src: url, width: 640, height: 360 });
  }, [editor]);

  const insertTable = useCallback(() => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  }, [editor]);

  return (
    <div className="flex items-center gap-0.5 flex-wrap p-1.5" style={{ borderBottom: "1px solid var(--apt-border)", background: "var(--apt-bg-subtle)" }}>
      <ToolbarButton title="Heading 1" active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 size={14} /></ToolbarButton>
      <ToolbarButton title="Heading 2" active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={14} /></ToolbarButton>
      <ToolbarButton title="Heading 3" active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={14} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={14} /></ToolbarButton>
      <ToolbarButton title="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={14} /></ToolbarButton>
      <ToolbarButton title="Strikethrough" active={editor.isActive("strike")} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough size={14} /></ToolbarButton>
      <ToolbarButton title="Code" active={editor.isActive("codeBlock")} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code2 size={14} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Bullet list" active={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={14} /></ToolbarButton>
      <ToolbarButton title="Numbered list" active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={14} /></ToolbarButton>
      <ToolbarButton title="Quote" active={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={14} /></ToolbarButton>
      <ToolbarButton title="Callout" active={editor.isActive("callout")} onClick={() => editor.commands.setCallout("info")}><MessageSquareWarning size={14} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Align left" active={editor.isActive({ textAlign: "left" })} onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft size={14} /></ToolbarButton>
      <ToolbarButton title="Align center" active={editor.isActive({ textAlign: "center" })} onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter size={14} /></ToolbarButton>
      <ToolbarButton title="Align right" active={editor.isActive({ textAlign: "right" })} onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight size={14} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Link" active={editor.isActive("link")} onClick={setLink}><Link2 size={14} /></ToolbarButton>
      <ToolbarButton title="Image from Media Library" onClick={onPickImage}><ImageIcon size={14} /></ToolbarButton>
      <ToolbarButton title="Table" onClick={insertTable}><Table2 size={14} /></ToolbarButton>
      <ToolbarButton title="Video embed" onClick={insertVideo}><Film size={14} /></ToolbarButton>
      <Divider />
      <ToolbarButton title="Undo" onClick={() => editor.chain().focus().undo().run()}><Undo2 size={14} /></ToolbarButton>
      <ToolbarButton title="Redo" onClick={() => editor.chain().focus().redo().run()}><Redo2 size={14} /></ToolbarButton>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-5 mx-1" style={{ background: "var(--apt-border)" }} />;
}

async function uploadFile(file: File): Promise<string | null> {
  try {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/assets/upload", { method: "POST", body: form });
    if (!res.ok) return null;
    const json = await res.json();
    return json.asset?.url ?? null;
  } catch {
    return null;
  }
}

export default function RichTextEditor({ value, onChange, placeholder }: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false }),
      ImageExtension.configure({ HTMLAttributes: { class: "rounded-lg max-w-full" } }),
      LinkExtension.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow, TableHeader, TableCell,
      Placeholder.configure({ placeholder: placeholder ?? "Start writing…" }),
      Youtube.configure({ nocookie: true }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Callout,
    ],
    content: value,
    onUpdate: ({ editor: e }) => onChange(e.getHTML()),
    editorProps: {
      attributes: { class: "article-editor-prose" },
      handleDrop(_view, event) {
        const files = Array.from(event.dataTransfer?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(async (file) => {
          const url = await uploadFile(file);
          if (url) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
        });
        return true;
      },
      handlePaste(_view, event) {
        const files = Array.from(event.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
        if (files.length === 0) return false;
        event.preventDefault();
        files.forEach(async (file) => {
          const url = await uploadFile(file);
          if (url) editor?.chain().focus().setImage({ src: url, alt: file.name }).run();
        });
        return true;
      },
    },
  });

  if (!editor) return null;
  const ed = editor;

  function handlePickImages(assets: Asset[]) {
    for (const asset of assets) {
      ed.chain().focus().setImage({ src: asset.url, alt: asset.altText ?? asset.filename ?? "" }).run();
    }
    setPickerOpen(false);
  }

  return (
    <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--apt-border)" }}>
      <Toolbar editor={editor} onPickImage={() => setPickerOpen(true)} />
      <div className="p-4" style={{ minHeight: 320, background: "var(--apt-bg)" }}>
        <EditorContent editor={editor} />
      </div>

      {pickerOpen && (
        <MediaPicker open={pickerOpen} onClose={() => setPickerOpen(false)} onSelect={handlePickImages} multiple accept="image" title="Insert image" />
      )}
    </div>
  );
}
