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
      if (this.buckets.size >= this.maxKeys && !existing) {
        return { allowed: false, retryAfterSeconds: Math.ceil(this.windowMs / 1000) };
      }
      this.buckets.set(key, { count: 1, resetAt: now + this.windowMs, lastSeen: now });
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

export function getTrustedClientKey(request: Request | { headers: Headers; ip?: string }) {
  const configuredProxy = process.env.TRUST_PROXY === "true";
  if (configuredProxy) {
    const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    if (forwarded && forwarded.length <= 128) return forwarded;
    const real = request.headers.get("x-real-ip")?.trim();
    if (real && real.length <= 128) return real;
  }
  const ip = "ip" in request ? request.ip : undefined;
  return ip && ip.length <= 128 ? ip : null;
}
