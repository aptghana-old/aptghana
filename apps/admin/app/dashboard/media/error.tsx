"use client";

export default function MediaError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 p-12 text-center">
      <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl" style={{ background: "#fee2e2" }}>
        ⚠️
      </div>
      <div>
        <p className="font-semibold mb-1" style={{ color: "var(--apt-text-primary)" }}>Failed to load Media Library</p>
        <p className="text-sm" style={{ color: "var(--apt-text-muted)" }}>{error.message}</p>
      </div>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-80"
        style={{ background: "#0057b8", color: "#ffffff" }}
      >
        Try again
      </button>
    </div>
  );
}
