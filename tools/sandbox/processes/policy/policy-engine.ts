export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  action: PolicyAction;
  conditions: PolicyCondition[];
  enabled: boolean;
}

export type PolicyAction = 'allow' | 'deny' | 'warn';

export interface PolicyCondition {
  field: string;
  operator: PolicyOperator;
  value: any;
}

export type PolicyOperator = 
  | 'equals'
  | 'contains'
  | 'startsWith'
  | 'endsWith'
  | 'regex'
  | 'greaterThan'
  | 'lessThan';

export interface PolicyEvaluationResult {
  allowed: boolean;
  action: PolicyAction;
  matchedRules: PolicyRule[];
  reason?: string;
}

export class PolicyEngine {
  private rules: Map<string, PolicyRule> = new Map();

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    const defaultRules: PolicyRule[] = [
      {
        id: 'rule_block_destructive',
        name: 'Block Destructive Commands',
        description: 'Prevent execution of destructive system commands',
        action: 'deny',
        conditions: [
          {
            field: 'command',
            operator: 'regex',
            value: 'rm\\s+-rf\\s+/',
          },
        ],
        enabled: true,
      },
      {
        id: 'rule_block_network',
        name: 'Block External Network',
        description: 'Prevent unauthorized network access',
        action: 'deny',
        conditions: [
          {
            field: 'command',
            operator: 'regex',
            value: 'curl.*\\s*\\|.*bash',
          },
        ],
        enabled: true,
      },
      {
        id: 'rule_block_sudo',
        name: 'Block Sudo',
        description: 'Prevent privilege escalation',
        action: 'deny',
        conditions: [
          {
            field: 'command',
            operator: 'startsWith',
            value: 'sudo',
          },
        ],
        enabled: true,
      },
      {
        id: 'rule_block_mkfs',
        name: 'Block Filesystem Operations',
        description: 'Prevent filesystem formatting',
        action: 'deny',
        conditions: [
          {
            field: 'command',
            operator: 'regex',
            value: 'mkfs|mke2fs|mkswap',
          },
        ],
        enabled: true,
      },
    ];

    defaultRules.forEach((rule) => this.addRule(rule));
  }

  addRule(rule: PolicyRule): void {
    this.rules.set(rule.id, rule);
  }

  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  evaluate(command: string): PolicyEvaluationResult {
    const matchedRules: PolicyRule[] = [];
    let finalAction: PolicyAction = 'allow';

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (this.matchesConditions(command, rule.conditions)) {
        matchedRules.push(rule);
        
        if (rule.action === 'deny') {
          finalAction = 'deny';
          break;
        } else if (rule.action === 'warn' && finalAction === 'allow') {
          finalAction = 'warn';
        }
      }
    }

    return {
      allowed: finalAction !== 'deny',
      action: finalAction,
      matchedRules,
      reason: matchedRules.length > 0
        ? `Blocked by rules: ${matchedRules.map((r) => r.name).join(', ')}`
        : undefined,
    };
  }

  validateCommand(command: string): { valid: boolean; reason?: string } {
    const result = this.evaluate(command);
    
    return {
      valid: result.allowed,
      reason: result.reason,
    };
  }

  getRules(): PolicyRule[] {
    return Array.from(this.rules.values());
  }

  private matchesConditions(
    command: string,
    conditions: PolicyCondition[]
  ): boolean {
    return conditions.every((condition) => {
      const value = this.extractFieldValue(command, condition.field);
      return this.evaluateCondition(value, condition);
    });
  }

  private extractFieldValue(command: string, field: string): any {
    switch (field) {
      case 'command':
        return command;
      default:
        return command;
    }
  }

  private evaluateCondition(value: any, condition: PolicyCondition): boolean {
    const { operator, value: expected } = condition;

    switch (operator) {
      case 'equals':
        return value === expected;
      case 'contains':
        return value.includes(expected);
      case 'startsWith':
        return value.startsWith(expected);
      case 'endsWith':
        return value.endsWith(expected);
      case 'regex':
        return new RegExp(expected).test(value);
      case 'greaterThan':
        return value > expected;
      case 'lessThan':
        return value < expected;
      default:
        return false;
    }
  }
}
