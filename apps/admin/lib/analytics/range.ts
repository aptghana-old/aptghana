export type Range = "7d" | "30d" | "90d";

const CONFIG: Record<Range, { label: string; days: number }> = {
  "7d":  { label: "7 days",  days: 7  },
  "30d": { label: "30 days", days: 30 },
  "90d": { label: "90 days", days: 90 },
};

export function resolveRange(param?: string | null): { key: Range; label: string; from: Date; to: Date; prevFrom: Date; prevTo: Date } {
  const key: Range = (param === "30d" || param === "90d") ? param : "7d";
  const { label, days } = CONFIG[key];
  const to = new Date();
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const prevTo = new Date(from);
  const prevFrom = new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
  return { key, label, from, to, prevFrom, prevTo };
}

export function deltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return ((current - previous) / previous) * 100;
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return n.toLocaleString();
}

export function formatPercent(n: number, decimals = 1): string {
  return `${(n * 100).toFixed(decimals)}%`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
}

export function sourceLabel(src: string | null | undefined): string {
  if (!src) return "Direct";
  const map: Record<string, string> = {
    direct: "Direct",
    referral: "Referral",
    google: "Google",
    bing: "Bing",
    facebook: "Facebook",
    linkedin: "LinkedIn",
    twitter: "Twitter / X",
    email: "Email",
  };
  return map[src.toLowerCase()] ?? src;
}
