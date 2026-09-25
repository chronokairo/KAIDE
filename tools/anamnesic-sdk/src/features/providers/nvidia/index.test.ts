import type { codeConfig } from "code/plugin-sdk/plugin-entry";
import {
  capturePluginRegistration,
  resolveProviderPluginChoice,
} from "code/plugin-sdk/plugin-test-runtime";
import { describe, expect, it, vi } from "vitest";
import plugin from "./index.js";

const promptAndConfigureNvidiaInteractiveMock = vi.hoisted(() =>
  vi.fn(async () => ({
    profiles: [
      {
        profileId: "nvidia:default",
        credential: { type: "api_key", provider: "nvidia", key: "nvapi-test" },
      },
    ],
    configPatch: {
      models: {
        providers: {
          nvidia: {
            baseUrl: "https://integrate.api.nvidia.com/v1",
            api: "openai-completions",
            models: [{ id: "nvidia/nemotron-3-super-120b-a12b", name: "Nemotron" }],
          },
        },
      },
    },
  })),
);
const configureNvidiaNonInteractiveMock = vi.hoisted(() => vi.fn(async () => null));
const discoverNvidiaProviderMock = vi.hoisted(() => vi.fn(async () => null));
const prepareNvidiaDynamicModelsMock = vi.hoisted(() =>
  vi.fn(async () => [
    {
      id: "nvidia/nemotron-3-super-120b-a12b",
      name: "Nemotron",
      provider: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
      input: ["text"],
      reasoning: true,
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 128000,
      maxTokens: 8192,
      compat: { requiresStringContent: true, supportsUsageInStreaming: true },
    },
  ]),
);

vi.mock("./api.js", () => ({
  NVIDIA_DEFAULT_API_KEY_ENV_VAR: "NVIDIA_API_KEY",
  NVIDIA_PROVIDER_ID: "nvidia",
  NVIDIA_PROVIDER_LABEL: "NVIDIA",
  buildNvidiaProvider: () => ({
    models: [
      {
        id: "nvidia/nemotron-3-super-120b-a12b",
        name: "Nemotron",
        compat: { requiresStringContent: true, supportsUsageInStreaming: true },
      },
      {
        id: "moonshotai/kimi-k2.5",
        name: "Kimi K2.5",
        compat: { requiresStringContent: true, supportsUsageInStreaming: true },
      },
      {
        id: "minimaxai/minimax-m2.5",
        name: "MiniMax M2.5",
        compat: { requiresStringContent: true, supportsUsageInStreaming: true },
      },
      {
        id: "z-ai/glm5",
        name: "GLM 5",
        compat: { requiresStringContent: true, supportsUsageInStreaming: true },
      },
    ],
  }),
  normalizeNvidiaConfiguredCatalogEntries: (models: unknown) =>
    Array.isArray(models)
      ? models
          .filter((model): model is Record<string, unknown> => Boolean(model))
          .map((model) => ({
            ...model,
            id: String(model.id ?? "").trim(),
            name: typeof model.name === "string" && model.name.trim() ? model.name.trim() : String(model.id ?? "").trim(),
            compat: {
              requiresStringContent: true,
              supportsUsageInStreaming: true,
              ...(typeof model.compat === "object" && model.compat ? model.compat : {}),
            },
          }))
          .filter((model) => model.id.length > 0)
      : [],
  resolveNvidiaInferenceBase: (baseUrl?: string) =>
    (baseUrl ?? "https://integrate.api.nvidia.com/v1").replace(/\/+$/, ""),
  promptAndConfigureNvidiaInteractive: promptAndConfigureNvidiaInteractiveMock,
  configureNvidiaNonInteractive: configureNvidiaNonInteractiveMock,
  discoverNvidiaProvider: discoverNvidiaProviderMock,
  prepareNvidiaDynamicModels: prepareNvidiaDynamicModelsMock,
}));

function registerNvidiaProvider() {
  const captured = capturePluginRegistration(plugin);
  const provider = captured.providers[0];
  expect(provider?.id).toBe("nvidia");
  return provider;
}

describe("nvidia provider hooks", () => {
  it("registers the nvidia provider with correct metadata", () => {
    const provider = registerNvidiaProvider();

    expect(provider.id).toBe("nvidia");
    expect(provider.label).toBe("NVIDIA");
    expect(provider.docsPath).toBe("/providers/nvidia");
    expect(provider.envVars).toEqual(["NVIDIA_API_KEY"]);
  });

  it("registers API-key auth choice metadata", () => {
    const provider = registerNvidiaProvider();

    expect(provider.auth?.map((method) => method.id)).toEqual(["api-key"]);

    const choice = resolveProviderPluginChoice({
      providers: [provider],
      choice: "nvidia-api-key",
    });
    expect(choice?.provider.id).toBe("nvidia");
    expect(choice?.method.id).toBe("api-key");
  });

  it("keeps nvidia wizard setup metadata aligned", () => {
    const provider = registerNvidiaProvider();

    expect(provider.wizard?.setup).toMatchObject({
      choiceId: "nvidia-api-key",
      choiceLabel: "NVIDIA API key",
      groupId: "nvidia",
      groupLabel: "NVIDIA",
      groupHint: "Direct API key",
      methodId: "api-key",
    });
  });

  it("keeps nvidia model picker metadata aligned", () => {
    const provider = registerNvidiaProvider();

    expect(provider.wizard?.modelPicker).toMatchObject({
      label: "NVIDIA (custom)",
      hint: "Detect models from NVIDIA /v1/models",
      methodId: "api-key",
    });
  });

  it("does not override replay policy for standard openai-compatible transport", () => {
    const provider = registerNvidiaProvider();

    // NVIDIA uses standard OpenAI-compatible API without custom replay logic
    expect(provider.buildReplayPolicy).toBeUndefined();
  });

  it("does not override stream wrapper for standard models", () => {
    const provider = registerNvidiaProvider();

    // NVIDIA uses standard streaming without custom wrappers
    expect(provider.wrapStreamFn).toBeUndefined();
  });

  it("surfaces the bundled NVIDIA models via augmentModelCatalog", () => {
    const provider = registerNvidiaProvider();

    const entries = provider.augmentModelCatalog?.({
      config: {} as codeConfig,
      env: process.env,
      entries: [],
    });

    expect(entries?.map((entry) => entry.id)).toEqual([
      "nvidia/nemotron-3-super-120b-a12b",
      "moonshotai/kimi-k2.5",
      "minimaxai/minimax-m2.5",
      "z-ai/glm5",
    ]);
    expect(entries?.every((entry) => entry.provider === "nvidia")).toBe(true);
  });

  it("opts into literal provider-prefix preservation", () => {
    const provider = registerNvidiaProvider();

    // NVIDIA's ids like nvidia/nemotron-... sit alongside moonshotai/...,
    // minimaxai/..., z-ai/... in the same catalog, so the leading nvidia/
    // is a vendor namespace rather than a redundant provider prefix. The
    // flag keeps the canonical ref as nvidia/nvidia/nemotron-... instead
    // of letting the default string-based dedupe collapse it.
    expect(provider.preserveLiteralProviderPrefix).toBe(true);
  });

  it("prepares and resolves dynamic nvidia models", async () => {
    const provider = registerNvidiaProvider();

    await provider.prepareDynamicModel?.({
      config: {},
      provider: "nvidia",
      providerConfig: { baseUrl: "https://integrate.api.nvidia.com/v1" },
      modelId: "nvidia/nemotron-3-super-120b-a12b",
      modelRegistry: { find: vi.fn(() => null) },
    } as never);

    expect(prepareNvidiaDynamicModelsMock).toHaveBeenCalledTimes(1);
    expect(
      provider.resolveDynamicModel?.({
        config: {},
        provider: "nvidia",
        providerConfig: { baseUrl: "https://integrate.api.nvidia.com/v1" },
        modelId: "nvidia/nemotron-3-super-120b-a12b",
        modelRegistry: { find: vi.fn(() => null) },
      } as never),
    ).toMatchObject({
      id: "nvidia/nemotron-3-super-120b-a12b",
      provider: "nvidia",
      baseUrl: "https://integrate.api.nvidia.com/v1",
    });
  });

  it("registers nvidia provider through the plugin api", () => {
    const registeredProviders: string[] = [];

    plugin.register({
      registerProvider(provider: { id: string }) {
        registeredProviders.push(provider.id);
      },
    } as any);

    expect(registeredProviders).toContain("nvidia");
  });
});
