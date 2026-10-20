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

// ── shared input-schema builder ───────────────────────────────────────────────

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, OpenAIFunctionParameter>;
  required: string[];
}

/**
 * Build the JSON-Schema object shared by all provider converters
 * (OpenAI `parameters`, Anthropic `input_schema`, Gemini `parameters`).
 */
export function buildToolInputSchema(def: McpToolDefinition): ToolInputSchema {
  const properties: Record<string, OpenAIFunctionParameter> = {};
  const required: string[] = [];

  for (const field of def.input) {
    properties[field.name] = fieldToProperty(field);
    if (field.required) required.push(field.name);
  }

  return { type: 'object', properties, required };
}

function toolDescription(def: McpToolDefinition): string {
  return `[${def.category}] ${def.description}` +
    (def.deprecated ? ' ⚠️ DEPRECATED — prefira alternativa mais recente.' : '');
}

// ── main converter ────────────────────────────────────────────────────────────

/**
 * Convert a single McpToolDefinition to an OpenAI tool object.
 */
export function toOpenAITool(def: McpToolDefinition): OpenAITool {
  return {
    type: 'function',
    function: {
      name: def.name,
      description: toolDescription(def),
      parameters: buildToolInputSchema(def),
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

// ── Anthropic tool shapes ─────────────────────────────────────────────────────

export interface AnthropicTool {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
}

/**
 * Convert a single McpToolDefinition to an Anthropic tool object
 * (Messages API `tools` format).
 */
export function toAnthropicTool(def: McpToolDefinition): AnthropicTool {
  return {
    name: def.name,
    description: toolDescription(def),
    input_schema: buildToolInputSchema(def),
  };
}

/**
 * Convert the full catalog to an array of Anthropic tools.
 * Optionally filter out deprecated tools.
 */
export function catalogToAnthropicTools(
  defs: McpToolDefinition[],
  { includeDeprecated = false }: { includeDeprecated?: boolean } = {},
): AnthropicTool[] {
  return defs
    .filter((d) => includeDeprecated || !d.deprecated)
    .map(toAnthropicTool);
}

// ── Gemini tool shapes ────────────────────────────────────────────────────────

export interface GeminiFunctionDeclaration {
  name: string;
  description: string;
  parameters: ToolInputSchema;
}

export interface GeminiTool {
  functionDeclarations: GeminiFunctionDeclaration[];
}

/**
 * Convert a single McpToolDefinition to a Gemini tool object
 * (Generative AI `functionDeclarations` format).
 *
 * Restriction: Gemini accepts an OpenAPI subset of JSON Schema. Fields of
 * type `json` are emitted as `{ type: 'object' }` without nested properties,
 * since arbitrary free-form objects cannot be expressed in that subset.
 */
export function toGeminiTool(def: McpToolDefinition): GeminiTool {
  const schema = buildToolInputSchema(def);
  const properties: Record<string, OpenAIFunctionParameter> = {};
  for (const [key, prop] of Object.entries(schema.properties)) {
    if (prop.type === 'object') {
      // OpenAPI subset: strip nested properties from free-form json fields
      const { properties: _omit, ...rest } = prop;
      properties[key] = rest;
    } else {
      properties[key] = prop;
    }
  }
  return {
    functionDeclarations: [
      {
        name: def.name,
        description: toolDescription(def),
        parameters: { type: 'object', properties, required: schema.required },
      },
    ],
  };
}

/**
 * Convert the full catalog to an array of Gemini tools.
 * Optionally filter out deprecated tools.
 */
export function catalogToGeminiTools(
  defs: McpToolDefinition[],
  { includeDeprecated = false }: { includeDeprecated?: boolean } = {},
): GeminiTool[] {
  return defs
    .filter((d) => includeDeprecated || !d.deprecated)
    .map(toGeminiTool);
}
