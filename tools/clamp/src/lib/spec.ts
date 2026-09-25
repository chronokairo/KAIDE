export type ExecutionSpec = {
  allowedTools?: readonly string[];
  readOnly?: boolean;
  maxToolCalls?: number;
};

const MUTATING_TOOLS = new Set(["write", "edit", "bash"]);

export function validateToolAgainstSpec(
  spec: ExecutionSpec | undefined,
  tool: string,
  callsSoFar: number,
): string | undefined {
  if (!spec) return undefined;
  if (spec.allowedTools && !spec.allowedTools.includes(tool)) {
    return `tool is not permitted by execution spec: ${tool}`;
  }
  if (spec.readOnly && MUTATING_TOOLS.has(tool)) {
    return `read-only execution spec forbids tool: ${tool}`;
  }
  if (spec.maxToolCalls !== undefined && callsSoFar >= spec.maxToolCalls) {
    return `execution spec reached maxToolCalls (${spec.maxToolCalls})`;
  }
  return undefined;
}
