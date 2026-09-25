// ─── Tool Registration & Management ───────────────────────────────────────────

import type { Tool, BetaToolUnion } from './types.js'

export type ToolFunction<T = any, R = any> = (args: T) => Promise<R> | R

export type RegisteredTool = {
  name: string
  description: string
  schema: Record<string, unknown>
  fn: ToolFunction
}

export class ToolRegistry {
  private tools: Map<string, RegisteredTool> = new Map()

  /**
   * Register a new tool
   */
  register<T = any, R = any>(
    name: string,
    description: string,
    schema: Record<string, unknown>,
    fn: ToolFunction<T, R>,
  ): void {
    this.tools.set(name, {
      name,
      description,
      schema,
      fn,
    })
  }

  /**
   * Unregister a tool
   */
  unregister(name: string): void {
    this.tools.delete(name)
  }

  /**
   * Get a tool by name
   */
  get(name: string): RegisteredTool | undefined {
    return this.tools.get(name)
  }

  /**
   * Check if a tool exists
   */
  has(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * List all registered tools
   */
  list(): RegisteredTool[] {
    return Array.from(this.tools.values())
  }

  /**
   * Get tools as BetaToolUnion array for API calls
   */
  toBetaToolUnion(): BetaToolUnion[] {
    return this.list().map(tool => ({
      type: 'custom',
      name: tool.name,
      description: tool.description,
      input_schema: tool.schema,
    }))
  }

  /**
   * Execute a tool by name with provided arguments
   */
  async execute(name: string, args: any): Promise<any> {
    const tool = this.tools.get(name)
    if (!tool) {
      throw new Error(`Tool not found: ${name}`)
    }

    try {
      const result = await tool.fn(args)
      return {
        success: true,
        result,
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }
    }
  }

  /**
   * Clear all registered tools
   */
  clear(): void {
    this.tools.clear()
  }
}

// ─── Tool Factory Helpers ─────────────────────────────────────────────────────

/**
 * Create a simple text tool
 */
export function createTextTool(
  name: string,
  description: string,
  fn: (text: string) => Promise<string> | string,
): RegisteredTool {
  return {
    name,
    description,
    schema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to process' },
      },
      required: ['text'],
    },
    fn: fn as ToolFunction,
  }
}

/**
 * Create a tool with custom schema
 */
export function createTool<T = any, R = any>(
  name: string,
  description: string,
  schema: Record<string, unknown>,
  fn: ToolFunction<T, R>,
): RegisteredTool {
  return {
    name,
    description,
    schema,
    fn,
  }
}
