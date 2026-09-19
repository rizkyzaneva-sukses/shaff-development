export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

type Bucket = { count: number; resetAt: number; lastSeen: number };

/**
 * Small, bounded process-local fixed-window limiter. It is intentionally
 * conservative when its in-memory capacity is exhausted: callers receive a
 * denial rather than allowing unbounded memory growth.
 */
export class BoundedRateLimiter {
  private readonly buckets = new Map<string, Bucket>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys: number,
  ) {}

  check(key: string, now = Date.now()): RateLimitResult {
    this.prune(now);
    const existing = this.buckets.get(key);
    if (!existing || existing.resetAt <= now) {
      if (!existing && this.buckets.size >= this.maxKeys) {
        return { allowed: false, retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
      }
      // A fresh window admits its first request and counts it immediately, so the
      // window never exceeds `limit` (the old code returned before incrementing).
      this.buckets.set(key, { count: this.limit <= 1 ? this.limit : 1, resetAt: now + this.windowMs, lastSeen: now });
      if (this.limit <= 1) {
        return this.limit < 1
          ? { allowed: false, retryAfterSeconds: Math.ceil(this.windowMs / 1000) }
          : { allowed: true, retryAfterSeconds: 0 };
      }
      return { allowed: true, retryAfterSeconds: 0 };
    }

    existing.lastSeen = now;
    if (existing.count >= this.limit) {
      return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt - now) / 1000)) };
    }
    existing.count += 1;
    return { allowed: true, retryAfterSeconds: 0 };
  }

  clear(key: string) {
    this.buckets.delete(key);
  }

  private prune(now: number) {
    this.buckets.forEach((bucket, key) => {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    });
    if (this.buckets.size < this.maxKeys) return;
    const oldest = Array.from(this.buckets.entries())
      .sort(([, left], [, right]) => left.lastSeen - right.lastSeen)
      .slice(0, Math.max(1, Math.floor(this.maxKeys * 0.1)));
    oldest.forEach(([key]) => this.buckets.delete(key));
  }
}

/**
 * Resolve the client IP for rate-limit bucketing.
 *
 * The app always runs behind Traefik (Easypanel), which sets x-forwarded-for, so
 * header trust is the default. TRUST_PROXY only acts as an explicit opt-out:
 * TRUST_PROXY=false disables header trust entirely. There is deliberately no
 * Pages Router `request.ip` fallback — it is always undefined in the App Router.
 */
export function getTrustedClientKey(request: Request | { headers: Headers }) {
  const trustHeaders = process.env.TRUST_PROXY !== "false";
  if (!trustHeaders) return null;
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwarded && forwarded.length <= 128) return forwarded;
  const real = request.headers.get("x-real-ip")?.trim();
  if (real && real.length <= 128) return real;
  return null;
}
