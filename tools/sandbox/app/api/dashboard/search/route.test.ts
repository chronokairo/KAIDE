import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/search/route";

describe("GET /api/dashboard/search", () => {
  it("returns matching resources for query", async () => {
    const response = await GET(new Request("http://localhost/api/dashboard/search?q=node"));
    const json = (await response.json()) as {
      nodes: unknown[];
      rules: unknown[];
      actions: unknown[];
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.nodes)).toBe(true);
    expect(Array.isArray(json.rules)).toBe(true);
    expect(Array.isArray(json.actions)).toBe(true);
  });
});
