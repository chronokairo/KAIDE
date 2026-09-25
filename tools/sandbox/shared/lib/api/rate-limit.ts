/**
 * In-memory sliding-window rate limiter.
 * Uses IP (or a provided key) as the bucket key.
 * No external dependencies; suitable for single-process environments.
 */

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

/** Remove expired entries from a bucket. */
function prune(bucket: Bucket, windowMs: number, now: number): void {
  const cutoff = now - windowMs;
  let i = 0;
  while (i < bucket.timestamps.length && bucket.timestamps[i] < cutoff) {
    i++;
  }
  bucket.timestamps.splice(0, i);
}

export interface RateLimitResult {
  allowed: boolean;
  /** Remaining allowed calls in the current window. */
  remaining: number;
  /** Seconds until the oldest request falls outside the window. */
  retryAfterSecs: number;
}

/**
 * Check and record a request for the given key.
 * @param key - Identifier for the caller (e.g. IP address).
 * @param limit - Max requests per window.
 * @param windowMs - Rolling window length in milliseconds.
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();

  if (!buckets.has(key)) {
    buckets.set(key, { timestamps: [] });
  }

  const bucket = buckets.get(key) as Bucket;
  prune(bucket, windowMs, now);

  if (bucket.timestamps.length >= limit) {
    const oldest = bucket.timestamps[0] ?? now;
    const retryAfterSecs = Math.ceil((oldest + windowMs - now) / 1000);
    return { allowed: false, remaining: 0, retryAfterSecs };
  }

  bucket.timestamps.push(now);
  return { allowed: true, remaining: limit - bucket.timestamps.length, retryAfterSecs: 0 };
}

/** Reset all rate-limit buckets (useful in tests). */
export function resetRateLimitBuckets(): void {
  buckets.clear();
}
