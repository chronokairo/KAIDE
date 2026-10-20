import { describe, expect, it } from 'vitest';

import type { McpToolDefinition } from '../catalog';
import {
  buildToolInputSchema,
  catalogToAnthropicTools,
  catalogToGeminiTools,
  catalogToOpenAITools,
  toAnthropicTool,
  toGeminiTool,
  toOpenAITool,
} from '../to-openai-tools';

const baseDef: McpToolDefinition = {
  name: 'demo_tool',
  category: 'Cadastros',
  title: 'Demo Tool',
  description: 'Faz algo de demonstração',
  outputHint: 'texto',
  input: [
    { name: 'query', label: 'Consulta', type: 'string', required: true, placeholder: 'ex.: foo', helperText: 'texto livre' },
    { name: 'limit', label: 'Limite', type: 'number' },
    { name: 'verbose', label: 'Verboso', type: 'boolean' },
    { name: 'mode', label: 'Modo', type: 'enum', options: ['a', 'b'] },
    { name: 'payload', label: 'Payload', type: 'json' },
  ],
};

const deprecatedDef: McpToolDefinition = {
  ...baseDef,
  name: 'old_tool',
  deprecated: true,
};

describe('toOpenAITool (regressão)', () => {
  it('mapeia tipos string/number/boolean/enum/json', () => {
    const tool = toOpenAITool(baseDef);
    const props = tool.function.parameters.properties;
    expect(props.query.type).toBe('string');
    expect(props.limit.type).toBe('number');
    expect(props.verbose.type).toBe('boolean');
    expect(props.mode).toMatchObject({ type: 'string', enum: ['a', 'b'] });
    expect(props.payload).toMatchObject({ type: 'object', properties: {} });
  });

  it('monta description com label + helperText + placeholder', () => {
    const tool = toOpenAITool(baseDef);
    expect(tool.function.parameters.properties.query.description)
      .toBe('Consulta — texto livre (ex: ex.: foo)');
  });

  it('marca required e prefixa [category] na description', () => {
    const tool = toOpenAITool(baseDef);
    expect(tool.function.parameters.required).toEqual(['query']);
    expect(tool.function.description).toBe('[Cadastros] Faz algo de demonstração');
  });

  it('adiciona sufixo deprecated e filtra via includeDeprecated', () => {
    const tool = toOpenAITool(deprecatedDef);
    expect(tool.function.description).toContain('DEPRECATED');
    expect(catalogToOpenAITools([baseDef, deprecatedDef])).toHaveLength(1);
    expect(catalogToOpenAITools([baseDef, deprecatedDef], { includeDeprecated: true })).toHaveLength(2);
  });
});

describe('toAnthropicTool', () => {
  it('emite shape { name, description, input_schema }', () => {
    const tool = toAnthropicTool(baseDef);
    expect(tool.name).toBe('demo_tool');
    expect(tool.description).toBe('[Cadastros] Faz algo de demonstração');
    expect(tool.input_schema.type).toBe('object');
    expect(tool.input_schema.required).toEqual(['query']);
    expect(tool.input_schema.properties.mode).toMatchObject({ type: 'string', enum: ['a', 'b'] });
  });

  it('filtra deprecated', () => {
    expect(catalogToAnthropicTools([baseDef, deprecatedDef])).toHaveLength(1);
    expect(catalogToAnthropicTools([baseDef, deprecatedDef], { includeDeprecated: true })).toHaveLength(2);
  });
});

describe('toGeminiTool', () => {
  it('emite shape { functionDeclarations: [...] } com parameters', () => {
    const tool = toGeminiTool(baseDef);
    expect(tool.functionDeclarations).toHaveLength(1);
    const decl = tool.functionDeclarations[0];
    expect(decl.name).toBe('demo_tool');
    expect(decl.parameters.type).toBe('object');
    expect(decl.parameters.required).toEqual(['query']);
  });

  it('campo json vira { type: object } sem properties (subset OpenAPI)', () => {
    const decl = toGeminiTool(baseDef).functionDeclarations[0];
    expect(decl.parameters.properties.payload).toMatchObject({ type: 'object' });
    expect(decl.parameters.properties.payload.properties).toBeUndefined();
  });

  it('filtra deprecated', () => {
    expect(catalogToGeminiTools([baseDef, deprecatedDef])).toHaveLength(1);
    expect(catalogToGeminiTools([baseDef, deprecatedDef], { includeDeprecated: true })).toHaveLength(2);
  });
});

describe('fonte única de schema', () => {
  it('parameters ≡ input_schema ≡ parameters (properties/required)', () => {
    const openai = toOpenAITool(baseDef).function.parameters;
    const anthropic = toAnthropicTool(baseDef).input_schema;
    const gemini = toGeminiTool(baseDef).functionDeclarations[0].parameters;
    const shared = buildToolInputSchema(baseDef);

    expect(openai).toEqual(shared);
    expect(anthropic).toEqual(shared);
    expect(gemini.required).toEqual(shared.required);
    for (const key of Object.keys(shared.properties)) {
      expect(gemini.properties[key].type).toBe(shared.properties[key].type);
    }
  });
});
