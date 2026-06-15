// Client-only — never imported in server components or route handlers

type EventType =
  | "pageview"
  | "product_view"
  | "search"
  | "add_to_cart"
  | "rfq_submit"
  | "order_complete"
  | "brand_view"
  | "category_view"
  | "document_download"
  | "click";

interface QueuedEvent {
  eventType: EventType;
  path: string;
  referrer?: string;
  properties?: Record<string, unknown>;
  sessionId: string;
  clientEventId: string;
  occurredAt: string;
}

const ENDPOINT = "/api/track";
const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 10_000;

function getUtmParams(): Record<string, string> {
  const out: Record<string, string> = {};
  try {
    const p = new URLSearchParams(window.location.search);
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const v = p.get(k);
      if (v) out[k] = v;
    }
  } catch { /* ignore */ }
  return out;
}

function readOrCreate(storage: Storage, key: string): string {
  let id = storage.getItem(key);
  if (!id) { id = crypto.randomUUID(); storage.setItem(key, id); }
  return id;
}

class Tracker {
  private queue: QueuedEvent[] = [];
  private sessionId = "";
  private timer: ReturnType<typeof setInterval> | null = null;
  private prevPath = "";
  private ready = false;

  init() {
    if (this.ready || typeof window === "undefined") return;
    this.ready = true;
    try {
      this.sessionId = readOrCreate(sessionStorage, "apt_sid");
    } catch {
      this.sessionId = crypto.randomUUID();
    }
    this.timer = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
    // Flush on tab hide/close — sendBeacon survives navigation
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") this.flush();
    });
  }

  trackPageView(path: string) {
    if (!this.ready || path === this.prevPath) return;
    this.prevPath = path;
    this.enqueue({
      eventType: "pageview",
      path,
      referrer: document.referrer || undefined,
      properties: getUtmParams(),
    });
  }

  track(eventType: EventType, properties?: Record<string, unknown>) {
    if (!this.ready) return;
    this.enqueue({ eventType, path: window.location.pathname, properties });
  }

  private enqueue(data: Pick<QueuedEvent, "eventType" | "path" | "referrer" | "properties">) {
    this.queue.push({
      ...data,
      sessionId: this.sessionId,
      clientEventId: crypto.randomUUID(),
      occurredAt: new Date().toISOString(),
    });
    if (this.queue.length >= BATCH_SIZE) this.flush();
  }

  flush() {
    if (!this.queue.length) return;
    const batch = this.queue.splice(0);
    const payload = JSON.stringify({ events: batch });
    const blob = new Blob([payload], { type: "application/json" });
    const sent = typeof navigator !== "undefined" && navigator.sendBeacon?.(ENDPOINT, blob);
    if (!sent) {
      fetch(ENDPOINT, { method: "POST", body: payload, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
    }
  }

  destroy() {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }
}

export const tracker = new Tracker();
