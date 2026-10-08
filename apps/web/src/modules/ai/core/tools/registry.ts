import type { AiExecutionContext, AiToolDefinition, AiToolResult } from './domain/types';
import { authorizeToolExecution } from './permissions';
import { supabase } from '@/shared/supabase';
import { FINANCE_DOMAIN_TOOLS } from './domain/finance-tools';
import { CRM_DOMAIN_TOOLS } from './domain/crm-tools';
import { CRM_WRITE_DOMAIN_TOOLS } from './domain/crm-write-tools';
import { SALES_DOMAIN_TOOLS } from './domain/sales-tools';
import { STOCK_DOMAIN_TOOLS } from './domain/stock-tools';
import { FISCAL_DOMAIN_TOOLS } from './domain/fiscal-tools';
import { CONTRACTS_DOMAIN_TOOLS } from './domain/contracts-tools';
import { PROJECTS_DOMAIN_TOOLS } from './domain/projects-tools';
import { BI_DOMAIN_TOOLS } from './domain/bi-tools';
import { WEB_DOMAIN_TOOLS } from './domain/web-tools';
import { biMetricsRepository } from '@/modules/bi/repositories/bi-metrics.repository';
import { customersRepository } from '@/modules/crm/repositories/customers.repository';
import { opportunitiesRepository } from '@/modules/crm/repositories/opportunities.repository';
import { contractsRepository } from '@/modules/financeiro/repositories/contracts.repository';
import { projectsRepository } from '@/modules/projetos/repositories/projects.repository';

export type HumanApprovalHandler = (tool: AiToolDefinition, input: unknown) => Promise<boolean>;

export class AiToolRegistry {
  private readonly tools = new Map<string, AiToolDefinition>();

  constructor() {
    this.registerAll(FINANCE_DOMAIN_TOOLS);
    this.registerAll(CRM_DOMAIN_TOOLS);
    this.registerAll(CRM_WRITE_DOMAIN_TOOLS);
    this.registerAll(SALES_DOMAIN_TOOLS);
    this.registerAll(STOCK_DOMAIN_TOOLS);
    this.registerAll(FISCAL_DOMAIN_TOOLS);
    this.registerAll(CONTRACTS_DOMAIN_TOOLS);
    this.registerAll(PROJECTS_DOMAIN_TOOLS);
    this.registerAll(BI_DOMAIN_TOOLS);
    this.registerAll(WEB_DOMAIN_TOOLS);
  }

  register<TInput = unknown, TOutput = unknown>(tool: AiToolDefinition<TInput, TOutput>): void {
    this.tools.set(tool.name, tool as AiToolDefinition);
  }

  registerTool<TInput = unknown, TOutput = unknown>(tool: AiToolDefinition<TInput, TOutput>): void {
    this.register(tool);
  }

  registerAll(tools: readonly AiToolDefinition[]): void {
    tools.forEach((tool) => this.register(tool));
  }

  get(name: string): AiToolDefinition | undefined { return this.tools.get(name); }
  getTool(name: string): AiToolDefinition | undefined { return this.get(name); }
  list(): AiToolDefinition[] { return [...this.tools.values()]; }

  async execute<TInput = unknown, TOutput = unknown>(
    name: string,
    input: TInput,
    ctx: AiExecutionContext,
    requestApproval?: HumanApprovalHandler,
  ): Promise<AiToolResult<TOutput>> {
    const startedAt = Date.now();
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`Ferramenta de IA não encontrada: ${name}`);

    if (!authorizeToolExecution(tool.requiredRole, ctx)) {
      await this.audit(tool, ctx, startedAt, 'denied', null, 'Papel não autorizado.');
      throw new Error(`Acesso negado para a ferramenta de IA: ${name}`);
    }

    let approved: boolean | null = null;
    if (tool.executionType === 'ACTION') {
      const missing = (tool.policy?.requiredPermissions ?? []).filter((permission) => !ctx.permissions.includes(permission));
      if (missing.length) {
        await this.audit(tool, ctx, startedAt, 'denied', false, `Permissões ausentes: ${missing.join(', ')}`);
        throw new Error(`Permissões insuficientes para ${name}.`);
      }
      if (tool.policy?.requiresHumanApproval) {
        approved = requestApproval ? await requestApproval(tool, input) : false;
        if (!approved) {
          await this.audit(tool, ctx, startedAt, 'denied', false, 'Aprovação humana ausente ou negada.');
          throw new Error(`${name} requer aprovação humana explícita.`);
        }
      }
    }

    try {
      const data = await tool.handler(input, ctx) as TOutput;
      const audit = await this.audit(tool, ctx, startedAt, 'success', approved, null);
      return { toolName: name, definitionVersion: tool.metadata.contractVersion, organizationId: ctx.organizationId, timestamp: new Date().toISOString(), data, audit };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.audit(tool, ctx, startedAt, 'error', approved, message);
      throw error;
    }
  }

  executeTool<TInput = unknown, TOutput = unknown>(name: string, input: TInput, ctx: AiExecutionContext, requestApproval?: HumanApprovalHandler): Promise<AiToolResult<TOutput>> {
    return this.execute(name, input, ctx, requestApproval);
  }

  private async audit(tool: AiToolDefinition, ctx: AiExecutionContext, startedAt: number, result: 'success' | 'error' | 'denied', humanApproval: boolean | null, error: string | null) {
    const event = {
      sessionId: ctx.sessionId,
      organizationId: ctx.organizationId,
      userId: ctx.userId,
      toolName: tool.name,
      executionType: tool.executionType === 'ACTION' ? 'ACTION_EXECUTION' as const : 'READ' as const,
      durationMs: Date.now() - startedAt,
      result,
      humanApproval,
      error,
      timestamp: new Date().toISOString(),
    };
    const { error: auditError } = await supabase.from('ai_tool_executions').insert({
      organization_id: ctx.organizationId,
      user_id: ctx.userId,
      tool_name: tool.name,
      execution_type: event.executionType,
      execution_status: result === 'success' ? 'Success' : result === 'denied' ? 'Denied' : 'Failed',
      duration_ms: event.durationMs,
      error_message: error,
    });
    if (auditError) throw new Error('A auditoria da execução da IA falhou; resultado bloqueado.', { cause: auditError });
    return event;
  }
}

export const aiToolRegistry = new AiToolRegistry();
