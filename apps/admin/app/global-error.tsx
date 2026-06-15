"use client";

import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset(): void }) {
  useEffect(() => {
    console.error("[APT Admin Global Error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc", color: "#0f172a" }}>
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ maxWidth: 420, width: "100%", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, background: "#0a1628", borderRadius: 12, marginBottom: 24 }}>
              <span style={{ color: "#ff6b00", fontWeight: 700, fontSize: 11 }}>APT</span>
            </div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>Critical error</h1>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>
              A critical application error occurred. Please reload the page.
            </p>
            {error.digest && (
              <p style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8", marginBottom: 24 }}>
                ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              style={{
                padding: "10px 20px", borderRadius: 8, background: "#0057b8",
                color: "#fff", border: "none", fontSize: 13, fontWeight: 500, cursor: "pointer",
              }}
            >
              Reload application
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
