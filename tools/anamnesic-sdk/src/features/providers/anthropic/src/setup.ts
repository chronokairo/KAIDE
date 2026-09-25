import {
  buildApiKeyCredential,
  ensureApiKeyFromEnvOrPrompt,
  hasConfiguredSecretInput,
  normalizeOptionalSecretInput,
  upsertAuthProfileWithLock,
  type codeConfig,
  type SecretInput,
  type SecretInputMode,
} from "code/plugin-sdk/provider-auth";
import type {
  ModelDefinitionConfig,
  ModelProviderConfig,
} from "code/plugin-sdk/provider-model-shared";
import { withAgentModelAliases } from "code/plugin-sdk/provider-onboard";
import {
  applyProviderDefaultModel,
  type ProviderAuthMethodNonInteractiveContext,
  type ProviderAuthResult,
  type ProviderCatalogContext,
  type ProviderPrepareDynamicModelContext,
  type ProviderRuntimeModel,
} from "code/plugin-sdk/provider-setup";
import { WizardCancelledError, type WizardPrompter } from "code/plugin-sdk/setup";
import {
  ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
  ANTHROPIC_DEFAULT_INFERENCE_BASE_URL,
  ANTHROPIC_PROVIDER_ID as PROVIDER_ID,
  ANTHROPIC_PROVIDER_LABEL,
} from "./defaults.js";
import { discoverAnthropicModels, fetchAnthropicModels } from "./models.fetch.js";
import {
  normalizeAnthropicConfiguredCatalogEntries,
  resolveAnthropicInferenceBase,
  selectDefaultAnthropicModelId,
} from "./models.js";
import { resolveAnthropicRequestContext } from "./runtime.js";

function resolveAnthropicProviderAuthMode(
  apiKey: ModelProviderConfig["apiKey"] | undefined,
): ModelProviderConfig["auth"] | undefined {
  const normalized = normalizeOptionalSecretInput(apiKey);
  if (normalized !== undefined) {
    return normalized.trim() ? "api-key" : undefined;
  }
  return hasConfiguredSecretInput(apiKey) ? "api-key" : undefined;
}

function buildAnthropicProviderConfig(params: {
  existingProvider?: ModelProviderConfig;
  baseUrl: string;
  apiKey?: ModelProviderConfig["apiKey"] | null;
  models: ModelDefinitionConfig[];
}): ModelProviderConfig {
  const next: ModelProviderConfig = {
    ...(params.existingProvider ?? {}),
    baseUrl: params.baseUrl,
    models: normalizeAnthropicConfiguredCatalogEntries(params.models),
  };

  if (params.apiKey === null) {
    delete next.apiKey;
  } else if (params.apiKey !== undefined) {
    next.apiKey = params.apiKey;
  }

  const authInput = params.apiKey === null ? undefined : params.apiKey ?? params.existingProvider?.apiKey;
  const auth = resolveAnthropicProviderAuthMode(authInput);
  if (auth) {
    next.auth = auth;
  } else {
    delete next.auth;
  }

  return next;
}

function mergeDiscoveredAnthropicAllowlistEntries(params: {
  existing?: NonNullable<NonNullable<codeConfig["agents"]>["defaults"]>["models"];
  discoveredModels: ModelDefinitionConfig[];
}) {
  return withAgentModelAliases(
    params.existing,
    params.discoveredModels
      .map((model) => model.id.trim())
      .filter(Boolean)
      .map((id) => `${PROVIDER_ID}/${id}`),
  );
}

function buildConfiguredAnthropicState(params: {
  config: codeConfig;
  existingProvider?: ModelProviderConfig;
  baseUrl: string;
  apiKey: ModelProviderConfig["apiKey"] | undefined;
  discoveredModels: ModelDefinitionConfig[];
  defaultModelId: string;
}): codeConfig {
  const allowlistEntries = mergeDiscoveredAnthropicAllowlistEntries({
    existing: params.config.agents?.defaults?.models,
    discoveredModels: params.discoveredModels,
  });

  return applyProviderDefaultModel(
    {
      ...params.config,
      agents: {
        ...params.config.agents,
        defaults: {
          ...params.config.agents?.defaults,
          models: allowlistEntries,
        },
      },
      models: {
        ...params.config.models,
        mode: params.config.models?.mode ?? "merge",
        providers: {
          ...params.config.models?.providers,
          [PROVIDER_ID]: buildAnthropicProviderConfig({
            existingProvider: params.existingProvider,
            baseUrl: params.baseUrl,
            apiKey: params.apiKey,
            models: params.discoveredModels,
          }),
        },
      },
    },
    `${PROVIDER_ID}/${params.defaultModelId}`,
  );
}

function buildAnthropicDiscoveryFailureLines(params: {
  baseUrl: string;
  status?: number;
  error?: unknown;
  requestedModelId?: string;
}) {
  if (params.status !== undefined) {
    return [`Anthropic model discovery failed (${params.status}) at ${params.baseUrl}.`];
  }
  if (params.error) {
    return [
      `Unable to reach Anthropic model discovery at ${params.baseUrl}.`,
      String(params.error),
    ];
  }
  if (params.requestedModelId) {
    return [`Anthropic model ${params.requestedModelId} was not found at ${params.baseUrl}.`];
  }
  return [`Anthropic did not return any models at ${params.baseUrl}.`];
}

export async function promptAndConfigureAnthropicInteractive(params: {
  config: codeConfig;
  agentDir?: string;
  prompter: WizardPrompter;
  secretInputMode?: SecretInputMode;
  allowSecretRefPrompt?: boolean;
  env?: NodeJS.ProcessEnv;
}): Promise<ProviderAuthResult> {
  let credentialInput: SecretInput | undefined;
  let credentialMode: SecretInputMode | undefined;
  const env = params.env ?? process.env;
  const implicitRefMode = params.allowSecretRefPrompt === false && !params.secretInputMode;
  const autoRefEnvKey = env[ANTHROPIC_DEFAULT_API_KEY_ENV_VAR]?.trim();

  const apiKey =
    implicitRefMode && autoRefEnvKey
      ? autoRefEnvKey
      : await ensureApiKeyFromEnvOrPrompt({
          config: params.config,
          provider: PROVIDER_ID,
          envLabel: ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
          promptMessage: `${ANTHROPIC_PROVIDER_LABEL} API key`,
          normalize: (value) => value.trim(),
          validate: (value) => (value?.trim() ? undefined : "Required"),
          prompter: params.prompter,
          secretInputMode:
            params.allowSecretRefPrompt === false
              ? (params.secretInputMode ?? "plaintext")
              : params.secretInputMode,
          setCredential: async (apiKeyValue, mode) => {
            credentialInput = apiKeyValue;
            credentialMode = mode;
          },
        });

  const normalizedApiKey = normalizeOptionalSecretInput(apiKey);
  const credentialSource =
    credentialInput ??
    (implicitRefMode && autoRefEnvKey ? `\${${ANTHROPIC_DEFAULT_API_KEY_ENV_VAR}}` : apiKey);
  const credential = buildApiKeyCredential(
    PROVIDER_ID,
    credentialSource,
    undefined,
    credentialMode
      ? { secretInputMode: credentialMode }
      : implicitRefMode && autoRefEnvKey
        ? { secretInputMode: "ref" }
        : undefined,
  );

  const baseUrl = ANTHROPIC_DEFAULT_INFERENCE_BASE_URL;
  const fetched = await fetchAnthropicModels({
    baseUrl,
    apiKey: normalizedApiKey ?? apiKey,
    timeoutMs: 5000,
  });
  if (!fetched.reachable || (fetched.status !== undefined && fetched.status >= 400)) {
    await params.prompter.note(
      buildAnthropicDiscoveryFailureLines({
        baseUrl,
        status: fetched.status,
        error: fetched.error,
      }).join("\n"),
      ANTHROPIC_PROVIDER_LABEL,
    );
    throw new WizardCancelledError("Anthropic model discovery failed");
  }

  const discoveredModels = await discoverAnthropicModels({
    baseUrl,
    apiKey: normalizedApiKey ?? apiKey,
    timeoutMs: 5000,
  });
  const defaultModelId = selectDefaultAnthropicModelId(discoveredModels);
  if (!defaultModelId) {
    await params.prompter.note(
      buildAnthropicDiscoveryFailureLines({ baseUrl }).join("\n"),
      ANTHROPIC_PROVIDER_LABEL,
    );
    throw new WizardCancelledError("Anthropic model discovery returned no usable models");
  }

  return {
    profiles: [
      {
        profileId: `${PROVIDER_ID}:default`,
        credential,
      },
    ],
    configPatch: buildConfiguredAnthropicState({
      config: params.config,
      existingProvider: params.config.models?.providers?.[PROVIDER_ID],
      baseUrl,
      apiKey: ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
      discoveredModels,
      defaultModelId,
    }),
  };
}

export async function configureAnthropicNonInteractive(
  ctx: ProviderAuthMethodNonInteractiveContext,
): Promise<codeConfig | null> {
  const requestedModelId = normalizeOptionalSecretInput(ctx.opts.customModelId);
  const resolved = await ctx.resolveApiKey({
    provider: PROVIDER_ID,
    flagValue:
      normalizeOptionalSecretInput(ctx.opts.anthropicApiKey) ??
      normalizeOptionalSecretInput(ctx.opts.customApiKey),
    flagName:
      normalizeOptionalSecretInput(ctx.opts.anthropicApiKey) !== undefined
        ? "--anthropic-api-key"
        : "--custom-api-key",
    envVar: ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
    envVarName: ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
    required: true,
  });

  if (!resolved?.key) {
    ctx.runtime.error(
      `Anthropic API key is required. Set ${ANTHROPIC_DEFAULT_API_KEY_ENV_VAR} or pass --anthropic-api-key.`,
    );
    ctx.runtime.exit(1);
    return null;
  }

  const baseUrl = ANTHROPIC_DEFAULT_INFERENCE_BASE_URL;
  const fetched = await fetchAnthropicModels({
    baseUrl,
    apiKey: resolved.key,
    timeoutMs: 5000,
  });
  if (!fetched.reachable || (fetched.status !== undefined && fetched.status >= 400)) {
    ctx.runtime.error(
      buildAnthropicDiscoveryFailureLines({
        baseUrl,
        status: fetched.status,
        error: fetched.error,
      }).join("\n"),
    );
    ctx.runtime.exit(1);
    return null;
  }

  const discoveredModels = await discoverAnthropicModels({
    baseUrl,
    apiKey: resolved.key,
    timeoutMs: 5000,
  });
  const selectedModelId = requestedModelId ?? selectDefaultAnthropicModelId(discoveredModels);
  const selectedModel = selectedModelId
    ? discoveredModels.find((model) => model.id === selectedModelId)
    : undefined;
  if (!selectedModelId || !selectedModel) {
    ctx.runtime.error(
      buildAnthropicDiscoveryFailureLines({
        baseUrl,
        requestedModelId: requestedModelId ?? undefined,
      }).join("\n"),
    );
    ctx.runtime.exit(1);
    return null;
  }

  if (resolved.source !== "env") {
    await upsertAuthProfileWithLock({
      profileId: `${PROVIDER_ID}:default`,
      credential: { type: "api_key", provider: PROVIDER_ID, key: resolved.key },
      agentDir: ctx.agentDir,
    });
  }

  const storedApiKey = resolved.source === "env" ? ANTHROPIC_DEFAULT_API_KEY_ENV_VAR : null;
  return buildConfiguredAnthropicState({
    config: ctx.config,
    existingProvider: ctx.config.models?.providers?.[PROVIDER_ID],
    baseUrl,
    apiKey: storedApiKey,
    discoveredModels,
    defaultModelId: selectedModelId,
  });
}

export async function discoverAnthropicProvider(
  ctx: ProviderCatalogContext,
): Promise<{ provider: ModelProviderConfig } | null> {
  const explicit = ctx.config.models?.providers?.[PROVIDER_ID];
  const explicitModels = normalizeAnthropicConfiguredCatalogEntries(explicit?.models);
  const baseUrl = resolveAnthropicInferenceBase(explicit?.baseUrl);
  const resolvedKeys = ctx.resolveProviderApiKey(PROVIDER_ID);
  const apiKey = normalizeOptionalSecretInput(resolvedKeys.discoveryApiKey ?? resolvedKeys.apiKey);

  const discoveredModels = apiKey
    ? await discoverAnthropicModels({
        baseUrl,
        apiKey,
        quiet: true,
      })
    : [];
  const models = discoveredModels.length > 0 ? discoveredModels : explicitModels;
  if (models.length === 0) {
    return null;
  }

  return {
    provider: buildAnthropicProviderConfig({
      existingProvider: explicit,
      baseUrl,
      apiKey: explicit?.apiKey ?? (apiKey ? ANTHROPIC_DEFAULT_API_KEY_ENV_VAR : undefined),
      models,
    }),
  };
}

export async function prepareAnthropicDynamicModels(
  ctx: ProviderPrepareDynamicModelContext,
): Promise<ProviderRuntimeModel[]> {
  const baseUrl = resolveAnthropicInferenceBase(ctx.providerConfig?.baseUrl);

  let apiKey: string | undefined;
  try {
    const resolved = await resolveAnthropicRequestContext({
      config: ctx.config,
      agentDir: ctx.agentDir,
      env: process.env,
      providerHeaders: ctx.providerConfig?.headers,
    });
    apiKey = resolved.apiKey;
  } catch {
    return [];
  }

  if (!apiKey) {
    return [];
  }

  const discoveredModels = await discoverAnthropicModels({
    baseUrl,
    apiKey,
    quiet: true,
  });
  return discoveredModels.map((model) => {
    const input = (model.input ?? ["text"]).filter(
      (entry): entry is "text" | "image" => entry === "text" || entry === "image",
    );

    return {
      id: model.id,
      name: model.name ?? model.id,
      provider: PROVIDER_ID,
      baseUrl,
      reasoning: model.reasoning ?? false,
      input: input.length > 0 ? input : ["text"],
      cost: model.cost ?? { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: model.contextWindow ?? 200000,
      maxTokens: model.maxTokens ?? 8192,
      compat: { ...(model.compat ?? {}), supportsUsageInStreaming: true },
    };
  });
}