import { describe, expect, it } from "vitest";
import { buildPlanFromPrompt } from "@/shared/lib/agent/planner";

describe("buildPlanFromPrompt", () => {
  it("creates fastapi plan from intent and uses extracted name", () => {
    const result = buildPlanFromPrompt("Create python api named Backend-Core", "ubuntu");

    expect(result.mode).toBe("ubuntu");
    expect(result.summary.toLowerCase()).toContain("fastapi");
    expect(result.steps.length).toBeGreaterThanOrEqual(4);
    expect(result.steps[0]?.command).toContain("backend-core");
  });

  it("creates node api plan in compatible mode", () => {
    const result = buildPlanFromPrompt("Scaffold an express service called edge_gateway", "ubuntu");

    expect(result.mode).toBe("ubuntu");
    expect(result.summary.toLowerCase()).toContain("node.js");
    expect(result.steps.some((step) => step.command.includes("npm init -y"))).toBe(true);
  });

  it("falls back safely when node api requested on incompatible mode", () => {
    const result = buildPlanFromPrompt("Create node api", "debian");

    expect(result.mode).toBe("debian");
    expect(result.summary.toLowerCase()).toContain("safe bootstrap");
    expect(result.steps[0]?.command).toBe("pwd");
  });

  it("builds security audit plan from security intent", () => {
    const result = buildPlanFromPrompt("run security audit for this repo", "nixos");

    expect(result.mode).toBe("nixos");
    expect(result.summary.toLowerCase()).toContain("security audit");
    expect(result.steps.some((step) => step.command.includes("audit_targets.txt"))).toBe(true);
  });

  it("builds log inspection plan when prompt asks for logs", () => {
    const result = buildPlanFromPrompt("show latest logs", "ubuntu");

    expect(result.mode).toBe("ubuntu");
    expect(result.summary.toLowerCase()).toContain("logs");
    expect(result.steps.some((step) => step.command.includes("cat logs/audit.log"))).toBe(true);
  });

  it("creates bootstrap plan for generic prompts", () => {
    const result = buildPlanFromPrompt("show environment", "debian");

    expect(result.mode).toBe("debian");
    expect(result.steps.length).toBe(3);
    expect(result.steps[0]?.command).toBe("pwd");
  });

  it("creates database setup plan for postgres intent", () => {
    const result = buildPlanFromPrompt("set up postgresql database", "ubuntu");

    expect(result.mode).toBe("ubuntu");
    expect(result.summary.toLowerCase()).toContain("postgresql");
    expect(result.steps.some((step) => step.command.includes("psql"))).toBe(true);
  });

  it("creates nixos database plan using nix-shell", () => {
    const result = buildPlanFromPrompt("setup sqlite database", "nixos");

    expect(result.mode).toBe("nixos");
    expect(result.steps.some((step) => step.command.includes("nix-shell"))).toBe(true);
  });

  it("creates docker-build plan on compatible mode", () => {
    const result = buildPlanFromPrompt("docker build image for app named my-service", "ubuntu");

    expect(result.mode).toBe("ubuntu");
    expect(result.summary.toLowerCase()).toContain("docker image");
    expect(result.steps.some((step) => step.command.includes("docker build"))).toBe(true);
    expect(result.steps.some((step) => step.command.includes("my-service"))).toBe(true);
  });

  it("falls back safely for docker-build on nixos", () => {
    const result = buildPlanFromPrompt("docker build image", "nixos");

    expect(result.mode).toBe("nixos");
    expect(result.summary.toLowerCase()).toContain("safe bootstrap");
  });

  it("creates cleanup plan for cleanup intent", () => {
    const result = buildPlanFromPrompt("clean up temporary files", "debian");

    expect(result.mode).toBe("debian");
    expect(result.summary.toLowerCase()).toContain("temporary");
    expect(result.steps.some((step) => step.command.includes("CLEANUP_DONE"))).toBe(true);
  });

  it("sanitizes project names rejecting path traversal", () => {
    const result = buildPlanFromPrompt("Create python api named ../etc/passwd", "ubuntu");

    expect(result.steps[0]?.command).not.toContain("..");
    expect(result.steps[0]?.command).toContain("fastapi_app");
  });

  it("sanitizes project names rejecting absolute paths", () => {
    const result = buildPlanFromPrompt("Scaffold express service called /root/evil", "ubuntu");

    expect(result.steps[0]?.command).not.toContain("/root/evil");
    expect(result.steps[0]?.command).toContain("node_api");
  });
});
