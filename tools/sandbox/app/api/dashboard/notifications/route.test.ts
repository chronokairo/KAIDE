import { describe, expect, it } from "vitest";
import { GET } from "@/app/api/dashboard/notifications/route";

describe("GET /api/dashboard/notifications", () => {
  it("returns notifications list", async () => {
    const response = await GET();
    const json = (await response.json()) as {
      items: Array<{ id: string; level: string; message: string }>;
    };

    expect(response.status).toBe(200);
    expect(Array.isArray(json.items)).toBe(true);
    expect(json.items.length).toBeGreaterThan(0);
  });
});
