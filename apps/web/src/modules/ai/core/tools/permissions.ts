import type { AiExecutionContext, AiUserRole } from './domain/types';

export function authorizeToolExecution(requiredRoles: readonly AiUserRole[] | undefined, ctx: AiExecutionContext): boolean {
  if (!ctx.organizationId || !ctx.userId || !ctx.sessionId) return false;
  return !requiredRoles?.length || requiredRoles.includes(ctx.userRole);
}
