import type { codeConfig } from "code/plugin-sdk/plugin-entry";
import { capturePluginRegistration } from "code/plugin-sdk/plugin-test-runtime";
import { describe, expect, it, vi } from "vitest";

const promptAndConfigureAnthropicInteractiveMock = vi.hoisted(() =>
  vi.fn(async () => ({
    profiles: [
      {
        profileId: "anthropic:default",
        credential: { type: "api_key", provider: "anthropic", key: "sk-ant-test" },
      },
    ],
    configPatch: {
      models: {
        providers: {
          anthropic: {
            baseUrl: "https://api.anthropic.com/v1",
            models: [{ id: "claude-sonnet-4-20250514", name: "Claude Sonnet 4" }],
          },
        },
      },
    },
  })),
);
const configureAnthropicNonInteractiveMock = vi.hoisted(() => vi.fn(async () => null));
const discoverAnthropicProviderMock = vi.hoisted(() => vi.fn(async () => null));
const prepareAnthropicDynamicModelsMock = vi.hoisted(() =>
  vi.fn(async () => [
    {
      id: "claude-sonnet-4-20250514",
      name: "Claude Sonnet 4",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com/v1",
      input: ["text", "image"],
      reasoning: false,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 200000,
      maxTokens: 8192,
      compat: { supportsUsageInStreaming: true },
    },
  ]),
);

vi.mock("./api.js", () => ({
  ANTHROPIC_DEFAULT_API_KEY_ENV_VAR: "ANTHROPIC_API_KEY",
  ANTHROPIC_DEFAULT_INFERENCE_BASE_URL: "https://api.anthropic.com/v1",
  ANTHROPIC_PROVIDER_ID: "anthropic",
  ANTHROPIC_PROVIDER_LABEL: "Anthropic",
  normalizeAnthropicConfiguredCatalogEntries: (models: unknown) =>
    Array.isArray(models)
      ? models
          .filter((model): model is Record<string, unknown> => Boolean(model))
          .map((model) => ({
            ...model,
            id: String(model.id ?? "").trim(),
            name: typeof model.name === "string" && model.name.trim() ? model.name.trim() : String(model.id ?? "").trim(),
          }))
          .filter((model) => model.id.length > 0)
      : [],
  resolveAnthropicInferenceBase: (baseUrl?: string) =>
    (baseUrl ?? "https://api.anthropic.com/v1").replace(/\/+$/, ""),
  promptAndConfigureAnthropicInteractive: promptAndConfigureAnthropicInteractiveMock,
  configureAnthropicNonInteractive: configureAnthropicNonInteractiveMock,
  discoverAnthropicProvider: discoverAnthropicProviderMock,
  prepareAnthropicDynamicModels: prepareAnthropicDynamicModelsMock,
}));

import plugin from "./index.js";

function registerProvider() {
  const captured = capturePluginRegistration(plugin);
  const provider = captured.providers[0];
  expect(provider?.id).toBe("anthropic");
  return provider;
}

describe("anthropic plugin", () => {
  it("registers the anthropic provider with correct metadata", () => {
    const provider = registerProvider();

    expect(provider).toMatchObject({
      id: "anthropic",
      label: "Anthropic",
      docsPath: "/providers/anthropic",
      envVars: ["ANTHROPIC_API_KEY"],
    });
    expect(provider?.auth?.map((method) => method.id)).toEqual(["api-key"]);
  });

  it("keeps anthropic wizard metadata aligned", () => {
    const provider = registerProvider();

    expect(provider?.wizard?.setup).toMatchObject({
      choiceId: "anthropic-api-key",
      choiceLabel: "Anthropic API key",
      groupId: "anthropic",
      groupLabel: "Anthropic",
      groupHint: "Claude API",
      methodId: "api-key",
    });
    expect(provider?.wizard?.modelPicker).toMatchObject({
      label: "Anthropic (Claude)",
      hint: "Detect models from Anthropic /v1/models",
      methodId: "api-key",
    });
  });

  it("augments the catalog with configured anthropic models", () => {
    const provider = registerProvider();
    const config = {
      models: {
        providers: {
          anthropic: {
            models: [
              {
                id: "claude-sonnet-4-20250514",
                name: "Claude Sonnet 4",
                contextWindow: 200000,
                reasoning: false,
                input: ["text", "image"],
                compat: { supportsUsageInStreaming: true },
              },
              {
                id: " ",
                name: "ignored",
              },
            ],
          },
        },
      },
    } as unknown as codeConfig;

    expect(
      provider?.augmentModelCatalog?.({
        config,
        agentDir: "/tmp/code",
        env: {},
        entries: [],
      }),
    ).toEqual([
      {
        provider: "anthropic",
        id: "claude-sonnet-4-20250514",
        name: "Claude Sonnet 4",
        compat: { supportsUsageInStreaming: true },
        contextWindow: 200000,
        contextTokens: undefined,
        reasoning: false,
        input: ["text", "image"],
      },
    ]);
  });

  it("prepares and resolves dynamic anthropic models", async () => {
    const provider = registerProvider();

    await provider?.prepareDynamicModel?.({
      config: {},
      provider: "anthropic",
      providerConfig: { baseUrl: "https://api.anthropic.com/v1" },
      modelId: "claude-sonnet-4-20250514",
      modelRegistry: { find: vi.fn(() => null) },
    } as never);

    expect(prepareAnthropicDynamicModelsMock).toHaveBeenCalledTimes(1);
    expect(
      provider?.resolveDynamicModel?.({
        config: {},
        provider: "anthropic",
        providerConfig: { baseUrl: "https://api.anthropic.com/v1" },
        modelId: "claude-sonnet-4-20250514",
        modelRegistry: { find: vi.fn(() => null) },
      } as never),
    ).toMatchObject({
      id: "claude-sonnet-4-20250514",
      provider: "anthropic",
      baseUrl: "https://api.anthropic.com/v1",
    });
  });
});