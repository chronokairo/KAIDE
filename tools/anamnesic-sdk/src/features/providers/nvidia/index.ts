import {
  definePluginEntry,
  type codeConfig,
  type codePluginApi,
  type ProviderAuthContext,
  type ProviderAuthMethodNonInteractiveContext,
  type ProviderAuthResult,
  type ProviderRuntimeModel,
} from "code/plugin-sdk/plugin-entry";
import {
  buildNvidiaProvider,
  NVIDIA_DEFAULT_API_KEY_ENV_VAR,
  NVIDIA_PROVIDER_ID,
  NVIDIA_PROVIDER_LABEL,
  normalizeNvidiaConfiguredCatalogEntries,
  resolveNvidiaInferenceBase,
} from "./api.js";

const dynamicModelCache = new Map<string, ProviderRuntimeModel[]>();

function buildDynamicCacheKey(baseUrl: string | undefined): string {
  return resolveNvidiaInferenceBase(baseUrl);
}

function resolveNvidiaAugmentedCatalogEntries(config: codeConfig | undefined) {
  const configuredEntries = config
    ? normalizeNvidiaConfiguredCatalogEntries(config.models?.providers?.[NVIDIA_PROVIDER_ID]?.models)
    : [];
  const entries = configuredEntries.length > 0 ? configuredEntries : (buildNvidiaProvider().models ?? []);

  return entries.map((entry) => ({
    provider: NVIDIA_PROVIDER_ID,
    id: entry.id,
    name: entry.name ?? entry.id,
    compat: {
      ...entry.compat,
      requiresStringContent: true,
      supportsUsageInStreaming: true,
    },
    contextWindow: entry.contextWindow,
    contextTokens: entry.contextTokens,
    reasoning: entry.reasoning,
    input: entry.input,
  }));
}

async function loadProviderSetup() {
  return await import("./api.js");
}

export default definePluginEntry({
  id: NVIDIA_PROVIDER_ID,
  name: "NVIDIA Provider",
  description: "Bundled NVIDIA provider plugin",
  register(api: codePluginApi) {
    api.registerProvider({
      id: NVIDIA_PROVIDER_ID,
      label: NVIDIA_PROVIDER_LABEL,
      docsPath: "/providers/nvidia",
      envVars: [NVIDIA_DEFAULT_API_KEY_ENV_VAR],
      preserveLiteralProviderPrefix: true,
      auth: [
        {
          id: "api-key",
          label: "NVIDIA API key",
          hint: "Direct API key",
          kind: "custom",
          run: async (ctx: ProviderAuthContext): Promise<ProviderAuthResult> => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.promptAndConfigureNvidiaInteractive({
              config: ctx.config,
              agentDir: ctx.agentDir,
              prompter: ctx.prompter,
              secretInputMode: ctx.secretInputMode,
              allowSecretRefPrompt: ctx.allowSecretRefPrompt,
              env: ctx.env,
            });
          },
          runNonInteractive: async (ctx: ProviderAuthMethodNonInteractiveContext) => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.configureNvidiaNonInteractive(ctx);
          },
        },
      ],
      discovery: {
        order: "early",
        run: async (ctx) => {
          const providerSetup = await loadProviderSetup();
          return await providerSetup.discoverNvidiaProvider(ctx);
        },
      },
      prepareDynamicModel: async (ctx) => {
        const providerSetup = await loadProviderSetup();
        dynamicModelCache.set(
          buildDynamicCacheKey(ctx.providerConfig?.baseUrl),
          await providerSetup.prepareNvidiaDynamicModels(ctx),
        );
      },
      resolveDynamicModel: (ctx) =>
        dynamicModelCache
          .get(buildDynamicCacheKey(ctx.providerConfig?.baseUrl))
          ?.find((model) => model.id === ctx.modelId),
      augmentModelCatalog: (ctx) => resolveNvidiaAugmentedCatalogEntries(ctx.config),
      wizard: {
        setup: {
          choiceId: "nvidia-api-key",
          choiceLabel: "NVIDIA API key",
          groupId: NVIDIA_PROVIDER_ID,
          groupLabel: "NVIDIA",
          groupHint: "Direct API key",
          methodId: "api-key",
          modelSelection: {
            promptWhenAuthChoiceProvided: true,
            allowKeepCurrent: false,
          },
        },
        modelPicker: {
          label: "NVIDIA (custom)",
          hint: "Detect models from NVIDIA /v1/models",
          methodId: "api-key",
        },
      },
    });
  },
});
