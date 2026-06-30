"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const ACCENT = "#84CC16";
const DARK_BG = "#0A0F1E";
const NAVY = "#0a1628";

const SUGGESTIONS = [
  "What Schneider Electric products do you carry?",
  "How do I submit an RFQ?",
  "What's your typical lead time?",
  "Find me a 3-phase motor",
];

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, padding: "14px 16px", alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--text-4)",
            display: "block",
            animation: `chatDot 1.2s ${i * 0.2}s ease-in-out infinite`,
          }}
        />
      ))}
    </div>
  );
}

interface MessageBubbleProps {
  role: "user" | "assistant" | string;
  parts: { type: string; text?: string }[];
}

function MessageBubble({ role, parts }: MessageBubbleProps) {
  const isUser = role === "user";
  const text = parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");

  if (!text) return null;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        padding: "0 14px",
        marginBottom: 10,
      }}
    >
      {!isUser && (
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: DARK_BG,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            marginRight: 8,
            marginTop: 2,
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden
          >
            <path
              d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2Z"
              fill={ACCENT}
            />
            <path
              d="M9 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm6 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm-6 3a3 3 0 0 0 6 0"
              fill={DARK_BG}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
      <div
        style={{
          maxWidth: "78%",
          padding: "10px 14px",
          borderRadius: isUser ? "18px 18px 4px 18px" : "4px 18px 18px 18px",
          background: isUser ? NAVY : "var(--bg-raised)",
          border: isUser ? "none" : "1px solid var(--border)",
          color: isUser ? "#fff" : "var(--text-1)",
          fontSize: 14,
          lineHeight: 1.6,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  );
}

export default function StoreChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [hasSentFirst, setHasSentFirst] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const send = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;
    setHasSentFirst(true);
    sendMessage({ text: trimmed }, { body: { pageContext: { pathname } } });
    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(inputValue);
    }
  };

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const unread = !open && messages.length > 0 && messages[messages.length - 1]?.role === "assistant";

  return (
    <>
      {/* Keyframes */}
      <style>{`
        @keyframes chatDot{0%,100%{opacity:.3;transform:scale(.85)}50%{opacity:1;transform:scale(1)}}
        @keyframes chatPulse{0%,100%{box-shadow:0 0 0 0 rgba(132,204,22,0.4)}70%{box-shadow:0 0 0 10px rgba(132,204,22,0)}}
        @keyframes chatSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
      `}</style>

      {/* Floating bubble */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close chat assistant" : "Open chat assistant"}
        aria-expanded={open}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          zIndex: 9000,
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: "none",
          background: DARK_BG,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 8px 28px rgba(0,0,0,0.35)",
          animation: hasSentFirst ? "none" : "chatPulse 2.4s ease-in-out infinite",
          transition: "transform .2s ease",
        }}
        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1.08)")}
        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.transform = "scale(1)")}
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5} aria-hidden>
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 0 1-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8Z"
              stroke={ACCENT}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
        {unread && (
          <span
            style={{
              position: "absolute",
              top: 3,
              right: 3,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: ACCENT,
              border: "2px solid var(--bg-base)",
            }}
          />
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          role="dialog"
          aria-label="APT Ghana AI assistant"
          aria-modal="true"
          style={{
            position: "fixed",
            bottom: 84,
            right: 12,
            zIndex: 8999,
            width: "min(420px, calc(100vw - 24px))",
            height: "min(600px, calc(100svh - 100px))",
            borderRadius: 20,
            background: "var(--bg-surface)",
            border: "1px solid var(--border)",
            boxShadow: "0 24px 56px -20px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.15)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            animation: "chatSlideUp .22s cubic-bezier(.16,1,.3,1)",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: DARK_BG,
              padding: "14px 16px",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: "50%",
                background: "rgba(255,255,255,0.08)",
                border: `2px solid ${ACCENT}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18"
                  stroke={ACCENT}
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", lineHeight: 1.2 }}>
                APT Ghana Assistant
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.3 }}>
                Industrial procurement · Powered by AI
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: "none",
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div
            style={{
              flex: 1,
              overflowY: "auto",
              overscrollBehavior: "contain",
              paddingTop: 16,
              paddingBottom: 8,
            }}
          >
            {/* Welcome state */}
            {messages.length === 0 && (
              <div style={{ padding: "0 14px" }}>
                <div
                  style={{
                    background: "var(--bg-raised)",
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    padding: "14px 16px",
                    marginBottom: 14,
                  }}
                >
                  <p style={{ fontSize: 13.5, color: "var(--text-2)", lineHeight: 1.6, margin: "0 0 4px" }}>
                    Hi! I can help you find industrial products, answer technical questions, and guide you through
                    the RFQ process.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--text-4)", margin: 0 }}>
                    Try a suggestion below or type your question.
                  </p>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      style={{
                        textAlign: "left",
                        background: "var(--bg-raised)",
                        border: "1px solid var(--border)",
                        borderRadius: 11,
                        padding: "9px 13px",
                        fontSize: 13,
                        color: "var(--text-2)",
                        cursor: "pointer",
                        lineHeight: 1.4,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                role={msg.role}
                parts={msg.parts.filter(isTextUIPart) as any}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div style={{ paddingLeft: 50 }}>
                <TypingDots />
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div
            style={{
              borderTop: "1px solid var(--border)",
              padding: "10px 12px",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexShrink: 0,
              background: "var(--bg-raised)",
            }}
          >
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about products, brands, lead times…"
              rows={1}
              aria-label="Message"
              style={{
                flex: 1,
                resize: "none",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "9px 12px",
                fontSize: 14,
                fontFamily: "inherit",
                color: "var(--text-1)",
                background: "var(--bg-surface)",
                outline: "none",
                lineHeight: 1.5,
                maxHeight: 120,
                overflowY: "auto",
              }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
            />
            {isLoading ? (
              <button
                onClick={stop}
                aria-label="Stop generating"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--bg-surface)",
                  color: "var(--text-3)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => send(inputValue)}
                disabled={!inputValue.trim()}
                aria-label="Send message"
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  border: inputValue.trim() ? "none" : "1px solid var(--border)",
                  background: inputValue.trim() ? ACCENT : "var(--bg-surface)",
                  color: inputValue.trim() ? DARK_BG : "var(--text-4)",
                  cursor: inputValue.trim() ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  transition: "background .15s ease, color .15s ease, border-color .15s ease",
                } as React.CSSProperties}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} aria-hidden>
                  <path d="M5 12h14m-7-7 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              textAlign: "center",
              padding: "6px 12px 8px",
              background: "var(--bg-raised)",
              borderTop: "1px solid var(--border)",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 11, color: "var(--text-4)" }}>
              AI can make mistakes.{" "}
              <Link
                href="/rfq"
                style={{ color: ACCENT, textDecoration: "none", fontWeight: 600 }}
                onClick={() => setOpen(false)}
              >
                Submit an RFQ
              </Link>{" "}
              for confirmed pricing.
            </span>
          </div>
        </div>
      )}
    </>
  );
}
