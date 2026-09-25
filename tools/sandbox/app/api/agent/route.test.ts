import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/agent/route";
import { runAgent } from "@/processes/agent-runtime/model/run-agent";
import { resetRateLimitBuckets } from "@/shared/lib/api/rate-limit";

vi.mock("@/processes/agent-runtime/model/run-agent", () => ({
  runAgent: vi.fn(),
}));

const mockResult = {
  mode: "ubuntu" as const,
  prompt: "test",
  plan: { summary: "s", mode: "ubuntu" as const, steps: [] },
  policy: { allowed: true, checks: [] },
  dryRun: true,
  results: [],
};

describe("POST /api/agent", () => {
  beforeEach(() => {
    resetRateLimitBuckets();
  });

  it("returns 400 when prompt is missing", async () => {
    const request = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "ubuntu" }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { error: string };

    expect(response.status).toBe(400);
    expect(json.error).toContain("Prompt is required");
  });

  it("returns 200 with run result", async () => {
    vi.mocked(runAgent).mockResolvedValue(mockResult);

    const request = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test", mode: "ubuntu", dryRun: true }),
    });

    const response = await POST(request);
    const json = (await response.json()) as { policy: { allowed: boolean } };

    expect(response.status).toBe(200);
    expect(json.policy.allowed).toBe(true);
  });

  it("returns RateLimit headers on successful request", async () => {
    vi.mocked(runAgent).mockResolvedValue(mockResult);

    const request = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.1" },
      body: JSON.stringify({ prompt: "test", mode: "debian", dryRun: true }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(response.headers.get("X-RateLimit-Limit")).toBe("10");
    expect(response.headers.get("X-RateLimit-Remaining")).not.toBeNull();
  });

  it("returns 429 after exceeding rate limit", async () => {
    vi.mocked(runAgent).mockResolvedValue(mockResult);

    for (let i = 0; i < 10; i++) {
      const req = new Request("http://localhost/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.99" },
        body: JSON.stringify({ prompt: "test", mode: "debian", dryRun: true }),
      });
      await POST(req);
    }

    const overLimit = new Request("http://localhost/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": "10.0.0.99" },
      body: JSON.stringify({ prompt: "test", mode: "debian", dryRun: true }),
    });

    const response = await POST(overLimit);
    const json = (await response.json()) as { error: string; retryAfterSecs: number };

    expect(response.status).toBe(429);
    expect(json.error).toContain("Too many requests");
    expect(json.retryAfterSecs).toBeGreaterThan(0);
    expect(response.headers.get("Retry-After")).not.toBeNull();
  });
});
