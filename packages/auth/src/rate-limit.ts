/**
 * Rate limiter with Upstash Redis backend for production and in-memory fallback for local dev.
 *
 * P-05: The in-memory implementation is NOT distributed — on Vercel, each function instance
 * has its own counter, so limits can be bypassed by spreading requests across instances.
 *
 * When UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set, this module uses
 * @upstash/ratelimit for a shared, distributed counter that works correctly on serverless.
 *
 * To enable:
 *   1. npm install @upstash/ratelimit @upstash/redis --workspace=packages/auth
 *   2. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in each app's env.
 *
 * In-memory fallback:
 * - M-24: Map size is capped at MAX_ENTRIES to prevent OOM under randomised-IP DDoS.
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
  // P-05: Use Upstash distributed rate limiter when credentials are available.
  // The async check() is intentionally wrapped to match the sync RateLimiter interface
  // via a per-call promise; callers must await it.
  if (
    typeof process !== "undefined" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return {
      check(key: string): RateLimitResult {
        throw new Error(
          "Upstash rate limiter requires async usage — call checkAsync() instead or " +
          "install @upstash/ratelimit and @upstash/redis then use createAsyncRateLimiter().",
        );
      },
    };
  }

  // In-memory fallback — suitable for single-instance (local dev, self-hosted VPS)
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
 * P-05: Async distributed rate limiter using Upstash Redis.
 * Requires @upstash/ratelimit and @upstash/redis to be installed.
 * Falls back to the in-memory implementation when Upstash env vars are absent.
 */
export async function createAsyncRateLimiter(
  maxRequests: number,
  windowMs: number,
): Promise<{ check(key: string): Promise<RateLimitResult> }> {
  if (
    typeof process !== "undefined" &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    // webpackIgnore tells both webpack and Turbopack to skip static analysis of these
    // imports — the packages are optional and only needed when Upstash env vars are set.
    const [{ Ratelimit }, { Redis }] = await Promise.all([
      // @ts-expect-error — optional peer dep; installed only when Upstash is enabled (P-05)
      import(/* webpackIgnore: true */ "@upstash/ratelimit"),
      // @ts-expect-error — optional peer dep
      import(/* webpackIgnore: true */ "@upstash/redis"),
    ]);
    const redis = Redis.fromEnv();
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(maxRequests, `${windowMs}ms`),
    });
    return {
      async check(key: string): Promise<RateLimitResult> {
        const { success, remaining, reset } = await ratelimit.limit(key);
        return { allowed: success, remaining, resetAt: reset };
      },
    };
  }

  // Fallback to synchronous in-memory limiter wrapped as async
  const sync = createRateLimiter(maxRequests, windowMs);
  return {
    async check(key: string): Promise<RateLimitResult> {
      return sync.check(key);
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
