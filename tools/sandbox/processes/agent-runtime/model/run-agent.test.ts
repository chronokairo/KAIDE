import { describe, expect, it, vi } from "vitest";
import { runAgent } from "@/processes/agent-runtime/model/run-agent";
import { buildPlanFromPrompt } from "@/shared/lib/agent/planner";
import { validateCommandPolicy } from "@/shared/lib/agent/policy";
import { executeInSandbox } from "@/shared/lib/agent/sandbox";

vi.mock("@/shared/lib/agent/audit", () => ({
  writeAuditLog: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/agent/planner", () => ({
  buildPlanFromPrompt: vi.fn(),
}));

vi.mock("@/shared/lib/agent/policy", () => ({
  validateCommandPolicy: vi.fn(),
}));

vi.mock("@/shared/lib/agent/sandbox", () => ({
  executeInSandbox: vi.fn(),
}));

describe("runAgent", () => {
  it("returns denied when policy blocks command", async () => {
    vi.mocked(buildPlanFromPrompt).mockReturnValue({
      summary: "test",
      mode: "ubuntu",
      steps: [{ id: "1", description: "d", command: "rm -rf /" }],
    });

    vi.mocked(validateCommandPolicy).mockReturnValue({
      allowed: false,
      reason: "blocked",
    });

    const result = await runAgent({ prompt: "x", mode: "ubuntu", dryRun: false });

    expect(result.policy.allowed).toBe(false);
    expect(result.results).toHaveLength(0);
  });

  it("returns preview when dryRun true and policy allows", async () => {
    vi.mocked(buildPlanFromPrompt).mockReturnValue({
      summary: "test",
      mode: "ubuntu",
      steps: [{ id: "1", description: "d", command: "pwd" }],
    });

    vi.mocked(validateCommandPolicy).mockReturnValue({ allowed: true });

    const result = await runAgent({ prompt: "x", mode: "ubuntu", dryRun: true });

    expect(result.policy.allowed).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.results).toHaveLength(0);
  });

  it("stops execution when a command fails", async () => {
    vi.mocked(buildPlanFromPrompt).mockReturnValue({
      summary: "test",
      mode: "ubuntu",
      steps: [
        { id: "1", description: "d", command: "pwd" },
        { id: "2", description: "d", command: "bad" },
        { id: "3", description: "d", command: "never" },
      ],
    });

    vi.mocked(validateCommandPolicy).mockReturnValue({ allowed: true });
    vi.mocked(executeInSandbox)
      .mockResolvedValueOnce({ command: "pwd", code: 0, stdout: "ok", stderr: "", durationMs: 1 })
      .mockResolvedValueOnce({ command: "bad", code: 1, stdout: "", stderr: "err", durationMs: 2 });

    const result = await runAgent({ prompt: "x", mode: "ubuntu", dryRun: false });

    expect(result.policy.allowed).toBe(true);
    expect(result.results).toHaveLength(2);
    expect(result.results[1].code).toBe(1);
    expect(vi.mocked(executeInSandbox)).toHaveBeenCalledTimes(2);
  });
});
