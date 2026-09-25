import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, type LanguageModel, type ToolSet } from "ai";
import { z } from "zod";
import type { ClampTool } from "../registry.js";

export type ProviderConfig = {
  baseURL: string;
  model: string;
  apiKey?: string;
};

export function toToolSet(tools: ClampTool[]): ToolSet {
  const set: ToolSet = {};
  for (const tool of tools) {
    set[tool.name] = {
      description: tool.description,
      parameters: tool.schema as unknown as z.ZodType,
    };
  }
  return set;
}

export function createModel(cfg: ProviderConfig): LanguageModel {
  const provider = createOpenAICompatible({
    name: "clamp-local",
    baseURL: cfg.baseURL,
    apiKey: cfg.apiKey ?? "clamp",
  });
  return provider(cfg.model);
}

export async function runModel({
  model,
  system,
  prompt,
  tools,
}: {
  model: LanguageModel;
  system: string;
  prompt: string;
  tools: ClampTool[];
}): Promise<string> {
  const toolSet = toToolSet(tools);
  const result = await generateText({
    model,
    system,
    prompt,
    tools: toolSet,
    toolChoice: "auto",
    maxRetries: 0,
  });
  return result.text;
}
