import type { LanguageModel } from "ai";
import {
  extractPlainTextToolCallBlocks,
  type PlainTextToolCallBlock,
} from "./lib/plain-text-tool-calls.js";
import { createModel, runModel } from "./providers/local.js";
import { ToolRegistry, type ClampTool } from "./registry.js";
import type { ProviderConfig } from "./providers/local.js";
import { compactContext } from "./lib/compaction.js";
import { ContextCache } from "./lib/context-cache.js";
import { modelPromptOverlay } from "./lib/model-prompt.js";
import { retry } from "./lib/retry.js";
import { validateToolAgainstSpec, type ExecutionSpec } from "./lib/spec.js";
import { ToolLoopDetector } from "./lib/tool-loop-detection.js";
import { formatAndTruncateToolResult } from "./lib/tool-result-truncation.js";

export type HarnessOptions = {
  system?: string;
  cwd?: string;
  maxSteps?: number;
  maxContextTokens?: number;
  spec?: ExecutionSpec;
};

export type HarnessEvent =
  | { type: "plan"; prompt: string; steps: string[] }
  | { type: "tool_call"; tool: string; args: Record<string, unknown> }
  | { type: "tool_result"; tool: string; ok: boolean; result?: unknown; error?: string }
  | { type: "text"; text: string }
  | { type: "complete"; answer: string };

const DEFAULT_SYSTEM = `You are a capable CLI agent. You have tools available to inspect and modify the local filesystem.
When you need to use a tool, output EXACTLY this format with no other text:
[TOOL_NAME]
{ "argument": "value" }
[/TOOL_NAME]
The JSON must be valid and match the tool's parameter schema exactly. Only call one tool at a time.`;

function planPrompt(prompt: string, toolNames: string[]): string {
  return [
    `Task: ${prompt}`,
    `Available tools: ${toolNames.join(", ")}`,
    "Think step by step. Use the tools to make progress. When you have the final answer, reply with just the answer and no tool block.",
  ].join("\n");
}

export class Harness {
  private registry = new ToolRegistry();
  private model: LanguageModel;
  private options: {
    system: string;
    cwd: string;
    maxSteps: number;
    maxContextTokens: number;
    spec?: ExecutionSpec;
  };
  private onEvent: (event: HarnessEvent) => void;
  private cache = new ContextCache();
  private loops = new ToolLoopDetector();

  constructor(
    cfg: ProviderConfig,
    options: HarnessOptions = {},
    onEvent: (event: HarnessEvent) => void = () => {},
  ) {
    this.model = createModel(cfg);
    this.options = {
      system: `${options.system ?? DEFAULT_SYSTEM}\n${modelPromptOverlay(cfg.model)}`,
      cwd: options.cwd ?? process.cwd(),
      maxSteps: options.maxSteps ?? 10,
      maxContextTokens: options.maxContextTokens ?? 8_000,
      spec: options.spec,
    };
    this.onEvent = onEvent;
  }

  registerTools(register: (registry: ToolRegistry) => void): void {
    register(this.registry);
  }

  getTools(): ClampTool[] {
    return this.registry
      .names()
      .map((name) => this.registry.get(name)!)
      .filter(Boolean);
  }

  async run(prompt: string): Promise<string> {
    const toolNames = this.registry.names();
    const tools = this.getTools();
    const sys = this.options.system;
    const initialPlan = planPrompt(prompt, toolNames);
    this.onEvent({ type: "plan", prompt, steps: toolNames.length ? [initialPlan] : [] });

    let workingPrompt = initialPlan;
    let answer = "";

    for (let step = 0; step < this.options.maxSteps; step += 1) {
      const output = await retry(
        () => runModel({
          model: this.model,
          system: sys,
          prompt: workingPrompt,
          tools: tools.length ? tools : [],
        }),
      );

      const blocks = output
        ? extractPlainTextToolCallBlocks(output, { allowedToolNames: toolNames })
        : null;

      if (!blocks || blocks.length === 0) {
        answer = output ?? "";
        this.onEvent({ type: "text", text: output ?? "" });
        this.onEvent({ type: "complete", answer });
        return answer;
      }

      const results: string[] = [];
      for (const block of blocks) {
        const policyError = validateToolAgainstSpec(this.options.spec, block.name, results.length);
        const loopError = this.loops.beforeCall(block.name, block.arguments);
        if (policyError || loopError) {
          const error = policyError ?? loopError ?? "tool execution blocked";
          this.onEvent({ type: "tool_result", tool: block.name, ok: false, error });
          results.push(`[${block.name}] ERROR: ${error}`);
          continue;
        }
        this.onEvent({ type: "tool_call", tool: block.name, args: block.arguments });
        const outcome = await this.registry.validateAndExecute(block, {
          cwd: this.options.cwd,
          cache: this.cache,
        });
        this.loops.recordOutcome(block.name, block.arguments, outcome);
        this.onEvent({
          type: "tool_result",
          tool: block.name,
          ok: outcome.ok,
          result: outcome.result,
          error: outcome.error,
        });
        results.push(formatToolResult(block, outcome));
      }

      const toolHistory = results.map((r) => `--- tool result ---\n${r}`).join("\n");
      workingPrompt = compactContext([
        `Task: ${prompt}`,
        `Previous partial results:`,
        toolHistory,
        `Continue. Use tools if needed. Otherwise reply with the final answer and no tool block.`,
      ].join("\n"), this.options.maxContextTokens);
    }

    answer = `Reached max steps (${this.options.maxSteps}) without a final answer.`;
    this.onEvent({ type: "complete", answer });
    return answer;
  }
}

function formatToolResult(
  block: PlainTextToolCallBlock,
  outcome: { ok: boolean; result?: unknown; error?: string; repaired: boolean },
): string {
  const extra = outcome.repaired ? " (repaired)" : "";
  if (outcome.ok) {
    return `[${block.name}]${extra}\n${formatAndTruncateToolResult(outcome.result, 16_000)}`;
  }
  return `[${block.name}] ERROR${extra}: ${outcome.error ?? "unknown"}`;
}
