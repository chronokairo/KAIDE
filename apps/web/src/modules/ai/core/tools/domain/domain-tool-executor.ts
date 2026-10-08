import { aiToolRegistry, type HumanApprovalHandler } from '../registry';
import type { AiExecutionContext, AiToolDefinition, AiToolResult } from './types';

export class DomainToolExecutor {
  registerTool(tool: AiToolDefinition): void { aiToolRegistry.register(tool); }
  registerTools(tools: readonly AiToolDefinition[]): void { aiToolRegistry.registerAll(tools); }
  listTools(): AiToolDefinition[] { return aiToolRegistry.list(); }
  executeTool<TInput = unknown, TOutput = unknown>(name: string, input: TInput, ctx: AiExecutionContext, requestApproval?: HumanApprovalHandler): Promise<AiToolResult<TOutput>> {
    return aiToolRegistry.execute(name, input, ctx, requestApproval);
  }
  execute<TInput = unknown, TOutput = unknown>(name: string, input: TInput, ctx: AiExecutionContext, requestApproval?: HumanApprovalHandler): Promise<AiToolResult<TOutput>> {
    return this.executeTool(name, input, ctx, requestApproval);
  }
}

export const domainToolExecutor = new DomainToolExecutor();
