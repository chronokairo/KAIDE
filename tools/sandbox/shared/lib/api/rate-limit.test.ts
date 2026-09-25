import { describe, expect, it, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimitBuckets } from "@/shared/lib/api/rate-limit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("allows requests within the limit", () => {
    const result1 = checkRateLimit("test-ip", 5, 60_000);
    expect(result1.allowed).toBe(true);
    expect(result1.remaining).toBe(4);

    const result2 = checkRateLimit("test-ip", 5, 60_000);
    expect(result2.allowed).toBe(true);
    expect(result2.remaining).toBe(3);
  });

  it("blocks requests when limit is exceeded", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("ip-block-test", 3, 60_000);
    }

    const result = checkRateLimit("ip-block-test", 3, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.retryAfterSecs).toBeGreaterThan(0);
  });

  it("isolates buckets by key", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("key-a", 3, 60_000);
    }
    const blocked = checkRateLimit("key-a", 3, 60_000);
    expect(blocked.allowed).toBe(false);

    const allowed = checkRateLimit("key-b", 3, 60_000);
    expect(allowed.allowed).toBe(true);
  });

  it("resets buckets cleanly", () => {
    for (let i = 0; i < 3; i++) {
      checkRateLimit("reset-key", 3, 60_000);
    }
    resetRateLimitBuckets();

    const result = checkRateLimit("reset-key", 3, 60_000);
    expect(result.allowed).toBe(true);
  });
});
