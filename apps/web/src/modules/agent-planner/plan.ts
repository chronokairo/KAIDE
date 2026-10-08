export type AgentStep =
  | { kind: 'navigate'; path: string; reason?: string; tabTarget?: string }
  | { kind: 'focus'; selector: string; reason?: string; tabTarget?: string }
  | { kind: 'type'; selector: string; text: string; clearBefore?: boolean; reason?: string; tabTarget?: string }
  | { kind: 'select'; selector: string; value: string; reason?: string; tabTarget?: string }
  | { kind: 'toggle'; selector: string; checked: boolean; reason?: string; tabTarget?: string }
  | { kind: 'click'; selector: string; confirm?: boolean; reason?: string; tabTarget?: string }
  | { kind: 'scrollTo'; selector: string; reason?: string; tabTarget?: string }
  | { kind: 'wait'; ms: number; reason?: string; tabTarget?: string }
  | { kind: 'waitFor'; selector: string; timeoutMs?: number; reason?: string; tabTarget?: string }
  | { kind: 'say'; text: string; reason?: string; tabTarget?: string }
  | { kind: 'invoke'; tool: string; input: Record<string, unknown>; reason?: string; tabTarget?: string }
  | { kind: 'openTab'; url: string; tabId: string; reason?: string; tabTarget?: string };

export interface AgentPlan {
  sessionId: string;
  title: string;
  steps: AgentStep[];
  destructive?: boolean;
}
