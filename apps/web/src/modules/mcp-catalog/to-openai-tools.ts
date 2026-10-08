/**
 * Converts McpToolDefinition[] from the catalog into the OpenAI
 * ChatCompletionTool format expected by /v1/chat/completions.
 *
 * JSON Schema types produced from McpToolField.type:
 *   string  → { type: 'string' }
 *   number  → { type: 'number' }
 *   boolean → { type: 'boolean' }
 *   enum    → { type: 'string', enum: [...] }
 *   json    → {} (any object)
 */

import type { McpToolDefinition, McpToolField } from './catalog';

// ── OpenAI tool shapes ────────────────────────────────────────────────────────

export interface OpenAIFunctionParameter {
  type?: string;
  enum?: string[];
  description?: string;
  properties?: Record<string, OpenAIFunctionParameter>;
  required?: string[];
  [key: string]: unknown;
}

export interface OpenAIFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, OpenAIFunctionParameter>;
    required: string[];
  };
}

export interface OpenAITool {
  type: 'function';
  function: OpenAIFunction;
}

// ── field → JSON Schema property ─────────────────────────────────────────────

function fieldToProperty(field: McpToolField): OpenAIFunctionParameter {
  const prop: OpenAIFunctionParameter = {
    description: field.label + (field.helperText ? ` — ${field.helperText}` : ''),
  };

  switch (field.type) {
    case 'string':
      prop.type = 'string';
      if (field.placeholder) prop.description += ` (ex: ${field.placeholder})`;
      break;
    case 'number':
      prop.type = 'number';
      break;
    case 'boolean':
      prop.type = 'boolean';
      break;
    case 'enum':
      prop.type = 'string';
      if (field.options?.length) prop.enum = field.options;
      break;
    case 'json':
      // No type restriction — LLM passes an object
      prop.type = 'object';
      prop.properties = {};
      break;
  }

  return prop;
}

// ── main converter ────────────────────────────────────────────────────────────

/**
 * Convert a single McpToolDefinition to an OpenAI tool object.
 */
export function toOpenAITool(def: McpToolDefinition): OpenAITool {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

  for (const field of def.input) {
    properties[field.name] = fieldToProperty(field);
    if (field.required) required.push(field.name);
  }

  return {
    type: 'function',
    function: {
      name: def.name,
      description: `[${def.category}] ${def.description}` +
        (def.deprecated ? ' ⚠️ DEPRECATED — prefira alternativa mais recente.' : ''),
      parameters: {
        type: 'object',
        properties,
        required,
      },
    },
  };
}

/**
 * Convert the full catalog to an array of OpenAI tools.
 * Optionally filter out deprecated tools.
 */
export function catalogToOpenAITools(
  defs: McpToolDefinition[],
  { includeDeprecated = false }: { includeDeprecated?: boolean } = {},
): OpenAITool[] {
  return defs
    .filter((d) => includeDeprecated || !d.deprecated)
    .map(toOpenAITool);
}
