// ─── Hooks & Policies for Security ────────────────────────────────────────────

import type { Tool, MessageParam } from './types.js'

export type HookContext = {
  messages: MessageParam[]
  tools?: Tool[]
  model?: string
  [key: string]: unknown
}

export type HookResponse = {
  allow: boolean
  modifiedContext?: HookContext
  message?: string
}

export interface Hook {
  name: string
  beforeRequest: (context: HookContext) => Promise<HookResponse>
  afterResponse?: (response: unknown) => Promise<void>
}

export type PolicyAction = 'allow' | 'deny' | 'ask_user'

export type Policy = {
  name: string
  description?: string
  action: PolicyAction
  pattern?: RegExp | string
  tools?: string[]
  onMatch?: (context: HookContext) => Promise<HookResponse>
}

// ─── Policy Runner ────────────────────────────────────────────────────────────

export class PolicyRunner {
  private policies: Policy[] = []

  addPolicy(policy: Policy): void {
    this.policies.push(policy)
  }

  removePolicy(name: string): void {
    this.policies = this.policies.filter(p => p.name !== name)
  }

  async evaluate(context: HookContext): Promise<HookResponse> {
    for (const policy of this.policies) {
      const matches = this.policyMatches(policy, context)
      if (matches) {
        if (policy.onMatch) {
          return await policy.onMatch(context)
        }

        switch (policy.action) {
          case 'allow':
            return { allow: true }
          case 'deny':
            return {
              allow: false,
              message: `Blocked by policy: ${policy.name}`,
            }
          case 'ask_user':
            // Default: deny if user cannot be asked
            return {
              allow: false,
              message: `Policy requires user approval: ${policy.name}`,
            }
        }
      }
    }

    // Default: allow if no policy matches
    return { allow: true }
  }

  private policyMatches(policy: Policy, context: HookContext): boolean {
    // Check if policy specifies tools
    if (policy.tools && policy.tools.length > 0) {
      const contextTools = context.tools?.map(t => t.name) ?? []
      const hasMatchingTool = policy.tools.some(tool =>
        contextTools.includes(tool),
      )
      if (!hasMatchingTool) {
        return false
      }
    }

    // Check pattern matching
    if (policy.pattern) {
      const pattern =
        typeof policy.pattern === 'string'
          ? new RegExp(policy.pattern)
          : policy.pattern

      const lastMessage = context.messages[context.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === 'string') {
        return pattern.test(lastMessage.content)
      }

      return false
    }

    return true
  }
}

// ─── Hook Runner ──────────────────────────────────────────────────────────────

export class HookRunner {
  private hooks: Hook[] = []

  addHook(hook: Hook): void {
    this.hooks.push(hook)
  }

  removeHook(name: string): void {
    this.hooks = this.hooks.filter(h => h.name !== name)
  }

  async beforeRequest(context: HookContext): Promise<HookResponse> {
    for (const hook of this.hooks) {
      try {
        const response = await hook.beforeRequest(context)
        if (!response.allow) {
          return response
        }
        // Apply context modifications if any
        if (response.modifiedContext) {
          context = response.modifiedContext
        }
      } catch (error) {
        return {
          allow: false,
          message: `Hook ${hook.name} failed: ${error instanceof Error ? error.message : String(error)}`,
        }
      }
    }

    return { allow: true }
  }

  async afterResponse(response: unknown): Promise<void> {
    for (const hook of this.hooks) {
      if (hook.afterResponse) {
        await hook.afterResponse(response)
      }
    }
  }
}

// ─── Pre-built Policies ───────────────────────────────────────────────────────

/**
 * Create a policy that allows all requests
 */
export function allowAllPolicy(): Policy {
  return {
    name: 'allow_all',
    action: 'allow',
  }
}

/**
 * Create a policy that denies specific tools
 */
export function denyToolsPolicy(toolNames: string[]): Policy {
  return {
    name: `deny_tools_${toolNames.join('_')}`,
    description: `Deny usage of tools: ${toolNames.join(', ')}`,
    action: 'deny',
    tools: toolNames,
  }
}

/**
 * Create a policy that requires user approval for specific patterns
 */
export function requireApprovalForPattern(pattern: RegExp | string): Policy {
  return {
    name: 'require_approval_pattern',
    description: 'Require user approval for matching requests',
    action: 'ask_user',
    pattern,
  }
}

/**
 * Create a read-only policy (blocks write/modify tools)
 */
export function readOnlyPolicy(): Policy {
  return {
    name: 'read_only',
    description: 'Only allow read operations',
    action: 'deny',
    tools: [
      'write_file',
      'delete_file',
      'execute_command',
      'edit_file',
      'create_file',
    ],
  }
}
