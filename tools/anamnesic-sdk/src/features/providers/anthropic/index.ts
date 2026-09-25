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
  ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
  ANTHROPIC_DEFAULT_INFERENCE_BASE_URL,
  ANTHROPIC_PROVIDER_ID,
  ANTHROPIC_PROVIDER_LABEL,
  normalizeAnthropicConfiguredCatalogEntries,
  resolveAnthropicInferenceBase,
} from "./api.js";

const dynamicModelCache = new Map<string, ProviderRuntimeModel[]>();

function buildDynamicCacheKey(baseUrl: string | undefined): string {
  return resolveAnthropicInferenceBase(baseUrl);
}

function resolveAnthropicAugmentedCatalogEntries(config: codeConfig | undefined) {
  if (!config) {
    return [];
  }

  return normalizeAnthropicConfiguredCatalogEntries(
    config.models?.providers?.[ANTHROPIC_PROVIDER_ID]?.models,
  ).map((entry) => ({
    provider: ANTHROPIC_PROVIDER_ID,
    id: entry.id,
    name: entry.name ?? entry.id,
    compat: { ...entry.compat, supportsUsageInStreaming: true },
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
  id: ANTHROPIC_PROVIDER_ID,
  name: "Anthropic Provider",
  description: "Bundled Anthropic provider plugin",
  register(api: codePluginApi) {
    api.registerProvider({
      id: ANTHROPIC_PROVIDER_ID,
      label: ANTHROPIC_PROVIDER_LABEL,
      docsPath: "/providers/anthropic",
      envVars: [ANTHROPIC_DEFAULT_API_KEY_ENV_VAR],
      auth: [
        {
          id: "api-key",
          label: "Anthropic API key",
          hint: "Claude API",
          kind: "custom",
          run: async (ctx: ProviderAuthContext): Promise<ProviderAuthResult> => {
            const providerSetup = await loadProviderSetup();
            return await providerSetup.promptAndConfigureAnthropicInteractive({
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
            return await providerSetup.configureAnthropicNonInteractive(ctx);
          },
        },
      ],
      discovery: {
        order: "early",
        run: async (ctx) => {
          const providerSetup = await loadProviderSetup();
          return await providerSetup.discoverAnthropicProvider(ctx);
        },
      },
      prepareDynamicModel: async (ctx) => {
        const providerSetup = await loadProviderSetup();
        dynamicModelCache.set(
          buildDynamicCacheKey(ctx.providerConfig?.baseUrl),
          await providerSetup.prepareAnthropicDynamicModels(ctx),
        );
      },
      resolveDynamicModel: (ctx) =>
        dynamicModelCache
          .get(buildDynamicCacheKey(ctx.providerConfig?.baseUrl))
          ?.find((model) => model.id === ctx.modelId),
      augmentModelCatalog: (ctx) => resolveAnthropicAugmentedCatalogEntries(ctx.config),
      wizard: {
        setup: {
          choiceId: "anthropic-api-key",
          choiceLabel: "Anthropic API key",
          groupId: ANTHROPIC_PROVIDER_ID,
          groupLabel: "Anthropic",
          groupHint: "Claude API",
          methodId: "api-key",
          modelSelection: {
            promptWhenAuthChoiceProvided: true,
            allowKeepCurrent: false,
          },
        },
        modelPicker: {
          label: "Anthropic (Claude)",
          hint: "Detect models from Anthropic /v1/models",
          methodId: "api-key",
        },
      },
    });
  },
});