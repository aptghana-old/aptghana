/**
 * Simple in-memory sliding-window rate limiter.
 *
 * Suitable for single-instance deployments (dev, small VPS, single Vercel
 * Fluid Compute instance). For multi-instance production, replace with
 * @upstash/ratelimit backed by a Redis instance.
 *
 * Security notes:
 * - M-24: Map size is capped at MAX_ENTRIES. When the cap is reached, the oldest
 *   entries are evicted (LRU-style) so the process cannot run out of memory under
 *   a DDoS with randomised source IPs.
 * - H-04: This limiter is NOT distributed. On Vercel (serverless), each function
 *   invocation may have a fresh counter. See PENDING_SECURITY_AUDIT.md for the
 *   recommended Upstash Redis migration path.
 */

const MAX_ENTRIES = 10_000;

interface Entry {
  count:   number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetAt:   number;
}

export interface RateLimiter {
  check(key: string): RateLimitResult;
}

export function createRateLimiter(maxRequests: number, windowMs: number): RateLimiter {
  // Use insertion-ordered Map so the first entry is the oldest (O(1) eviction)
  const store = new Map<string, Entry>();

  // Prune stale entries every windowMs
  if (typeof setInterval !== "undefined") {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of store) {
        if (now > entry.resetAt) store.delete(key);
      }
    }, windowMs).unref?.();
  }

  return {
    check(key: string): RateLimitResult {
      const now   = Date.now();
      const entry = store.get(key);

      if (!entry || now > entry.resetAt) {
        // Evict the oldest entry when the Map is at capacity
        if (!entry && store.size >= MAX_ENTRIES) {
          store.delete(store.keys().next().value as string);
        }
        const resetAt = now + windowMs;
        store.set(key, { count: 1, resetAt });
        return { allowed: true, remaining: maxRequests - 1, resetAt };
      }

      if (entry.count >= maxRequests) {
        return { allowed: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return { allowed: true, remaining: maxRequests - entry.count, resetAt: entry.resetAt };
    },
  };
}

/**
 * Extract client IP from a Next.js Request.
 *
 * Preference order:
 * 1. x-real-ip — set by Traefik/Nginx from the actual TCP connection; clients
 *    cannot forge this in a correctly configured deployment.
 * 2. x-forwarded-for (first entry) — only trusted when TRUSTED_PROXY_HEADER=1
 *    is explicitly set (e.g. behind Vercel, which strips client-supplied values).
 * 3. Fallback to "unknown".
 *
 * SEC-008: Without this ordering, a client can rotate X-Forwarded-For to bypass
 * IP-based rate limiters in deployments that don't strip the header at ingress.
 */
export function getClientIp(req: Request): string {
  const headers = req instanceof Request ? req.headers : (req as { headers: Headers }).headers;
  const realIp = headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  if (process.env.TRUSTED_PROXY_HEADER === "1") {
    const xff = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (xff) return xff;
  }
  return "unknown";
}
