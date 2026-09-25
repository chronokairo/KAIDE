import { z } from "zod";
import { tryExtractUsableToolCallArguments } from "./lib/tool-call-args.js";
import type { PlainTextToolCallBlock } from "./lib/plain-text-tool-calls.js";
import type { ContextCache } from "./lib/context-cache.js";

export type ToolContext = {
  cwd: string;
  cache?: ContextCache;
};

export type ClampTool<TSchema extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  schema: TSchema;
  execute: (args: z.infer<TSchema>, ctx: ToolContext) => Promise<unknown> | unknown;
};

export function defineTool<TSchema extends z.ZodType>(tool: ClampTool<TSchema>): ClampTool<TSchema> {
  return tool;
}

export class ToolRegistry {
  private tools = new Map<string, ClampTool<any>>();

  register(tool: ClampTool<any>): void {
    this.tools.set(tool.name, tool);
  }

  has(name: string): boolean {
    return this.tools.has(name);
  }

  names(): string[] {
    return [...this.tools.keys()];
  }

  get(name: string): ClampTool<any> | undefined {
    return this.tools.get(name);
  }

  /**
   * Validate and execute a raw (possibly malformed) tool call.
   * Uses the extracted repair logic before falling back to Zod validation,
   * so small models that emit messy JSON still stay inside the schema.
   */
  async validateAndExecute(
    call: PlainTextToolCallBlock,
    ctx: ToolContext,
  ): Promise<{
    tool: string;
    ok: boolean;
    result?: unknown;
    error?: string;
    repaired: boolean;
  }> {
    const tool = this.tools.get(call.name);
    if (!tool) {
      return { tool: call.name, ok: false, error: `unknown tool: ${call.name}`, repaired: false };
    }

    let raw = call.arguments;
    let repaired = false;
    const repairAttempt = tryExtractUsableToolCallArguments(JSON.stringify(call.arguments) ?? "", {
      decodeHtml: true,
    });
    if (repairAttempt && repairAttempt.kind === "repaired") {
      raw = repairAttempt.args;
      repaired = true;
    }

    const parsed = tool.schema.safeParse(raw);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .slice(0, 3)
        .map((issue: z.ZodIssue) => `\`${issue.path.join(".")}\` ${issue.message}`)
        .join("; ");
      return { tool: call.name, ok: false, error: issues || "invalid arguments", repaired };
    }

    try {
      const result = await tool.execute(parsed.data, ctx);
      return { tool: call.name, ok: true, result, repaired };
    } catch (error) {
      return {
        tool: call.name,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        repaired,
      };
    }
  }
}
