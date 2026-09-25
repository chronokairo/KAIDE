import { AgentMode, AgentRunResult } from "@/entities/agent/model/types";
import { writeAuditLog } from "@/shared/lib/agent/audit";
import { buildPlanFromPrompt } from "@/shared/lib/agent/planner";
import { validateCommandPolicy } from "@/shared/lib/agent/policy";
import { executeInSandbox } from "@/shared/lib/agent/sandbox";

interface RunAgentInput {
  prompt: string;
  mode: AgentMode;
  dryRun: boolean;
  /** Per-step execution timeout in ms. Defaults to 30_000. */
  stepTimeoutMs?: number;
}

export async function runAgent(input: RunAgentInput): Promise<AgentRunResult> {
  const { prompt, mode, dryRun, stepTimeoutMs = 30_000 } = input;
  const plan = buildPlanFromPrompt(prompt, mode);

  const checks = plan.steps.map((step) => ({
    command: step.command,
    ...validateCommandPolicy(step.command, mode),
  }));

  const denied = checks.find((check) => !check.allowed);
  if (denied) {
    const output: AgentRunResult = {
      mode,
      prompt,
      plan,
      policy: {
        allowed: false,
        checks,
      },
      dryRun,
      results: [],
    };

    await writeAuditLog("policy.denied", output);
    return output;
  }

  if (dryRun) {
    const output: AgentRunResult = {
      mode,
      prompt,
      plan,
      policy: {
        allowed: true,
        checks,
      },
      dryRun,
      results: [],
    };

    await writeAuditLog("run.preview", output);
    return output;
  }

  const results = [];

  for (const step of plan.steps) {
    const result = await executeInSandbox(mode, step.command, stepTimeoutMs);
    results.push(result);

    if (result.code !== 0) {
      break;
    }
  }

  const output: AgentRunResult = {
    mode,
    prompt,
    plan,
    policy: {
      allowed: true,
      checks,
    },
    dryRun,
    results,
  };

  await writeAuditLog("run.executed", output);
  return output;
}
