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
  NVIDIA_DEFAULT_API_KEY_ENV_VAR,
  NVIDIA_DEFAULT_INFERENCE_BASE_URL,
  NVIDIA_PROVIDER_ID as PROVIDER_ID,
  NVIDIA_PROVIDER_LABEL,
} from "./defaults.js";
import { discoverNvidiaModels, fetchNvidiaModels } from "./models.fetch.js";
import {
  buildNvidiaSeedModels,
  normalizeNvidiaConfiguredCatalogEntries,
  resolveNvidiaInferenceBase,
  selectDefaultNvidiaModelId,
} from "./models.js";
import { resolveNvidiaRequestContext } from "./runtime.js";

function resolveNvidiaProviderAuthMode(
  apiKey: ModelProviderConfig["apiKey"] | undefined,
): ModelProviderConfig["auth"] | undefined {
  const normalized = normalizeOptionalSecretInput(apiKey);
  if (normalized !== undefined) {
    return normalized.trim() ? "api-key" : undefined;
  }
  return hasConfiguredSecretInput(apiKey) ? "api-key" : undefined;
}

function buildNvidiaProviderConfig(params: {
  existingProvider?: ModelProviderConfig;
  baseUrl: string;
  apiKey?: ModelProviderConfig["apiKey"] | null;
  models: ModelDefinitionConfig[];
}): ModelProviderConfig {
  const next: ModelProviderConfig = {
    ...(params.existingProvider ?? {}),
    api: params.existingProvider?.api ?? "openai-completions",
    baseUrl: params.baseUrl,
    models: normalizeNvidiaConfiguredCatalogEntries(params.models),
  };

  if (params.apiKey === null) {
    delete next.apiKey;
  } else if (params.apiKey !== undefined) {
    next.apiKey = params.apiKey;
  }

  const authInput = params.apiKey === null ? undefined : params.apiKey ?? params.existingProvider?.apiKey;
  const auth = resolveNvidiaProviderAuthMode(authInput);
  if (auth) {
    next.auth = auth;
  } else {
    delete next.auth;
  }

  return next;
}

function mergeDiscoveredNvidiaAllowlistEntries(params: {
  existing?: NonNullable<NonNullable<codeConfig["agents"]>["defaults"]>["models"];
  discoveredModels: ModelDefinitionConfig[];
}) {
  return withAgentModelAliases(
    params.existing,
    params.discoveredModels
      .map((model) => model.id.trim())
      .filter(Boolean),
  );
}

function buildConfiguredNvidiaState(params: {
  config: codeConfig;
  existingProvider?: ModelProviderConfig;
  baseUrl: string;
  apiKey: ModelProviderConfig["apiKey"] | undefined;
  discoveredModels: ModelDefinitionConfig[];
  defaultModelId: string;
}): codeConfig {
  const allowlistEntries = mergeDiscoveredNvidiaAllowlistEntries({
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
          [PROVIDER_ID]: buildNvidiaProviderConfig({
            existingProvider: params.existingProvider,
            baseUrl: params.baseUrl,
            apiKey: params.apiKey,
            models: params.discoveredModels,
          }),
        },
      },
    },
    params.defaultModelId,
  );
}

function buildNvidiaDiscoveryFailureLines(params: {
  baseUrl: string;
  status?: number;
  error?: unknown;
  requestedModelId?: string;
}) {
  if (params.status !== undefined) {
    return [`NVIDIA model discovery failed (${params.status}) at ${params.baseUrl}.`];
  }
  if (params.error) {
    return [
      `Unable to reach NVIDIA model discovery at ${params.baseUrl}.`,
      String(params.error),
    ];
  }
  if (params.requestedModelId) {
    return [`NVIDIA model ${params.requestedModelId} was not found at ${params.baseUrl}.`];
  }
  return [`NVIDIA did not return any models at ${params.baseUrl}.`];
}

function resolveConfiguredOrSeedNvidiaModels(models: ModelDefinitionConfig[]): ModelDefinitionConfig[] {
  return models.length > 0 ? models : buildNvidiaSeedModels();
}

function mapNvidiaConfigToRuntimeModel(
  baseUrl: string,
  model: ModelDefinitionConfig,
): ProviderRuntimeModel {
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
    contextWindow: model.contextWindow,
    maxTokens: model.maxTokens,
    compat: {
      ...(model.compat ?? {}),
      requiresStringContent: true,
      supportsUsageInStreaming: true,
    },
  };
}

export async function promptAndConfigureNvidiaInteractive(params: {
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
  const autoRefEnvKey = env[NVIDIA_DEFAULT_API_KEY_ENV_VAR]?.trim();

  const apiKey =
    implicitRefMode && autoRefEnvKey
      ? autoRefEnvKey
      : await ensureApiKeyFromEnvOrPrompt({
          config: params.config,
          provider: PROVIDER_ID,
          envLabel: NVIDIA_DEFAULT_API_KEY_ENV_VAR,
          promptMessage: `${NVIDIA_PROVIDER_LABEL} API key`,
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
    (implicitRefMode && autoRefEnvKey ? `\${${NVIDIA_DEFAULT_API_KEY_ENV_VAR}}` : apiKey);
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

  const baseUrl = NVIDIA_DEFAULT_INFERENCE_BASE_URL;
  const fetched = await fetchNvidiaModels({
    baseUrl,
    apiKey: normalizedApiKey ?? apiKey,
    timeoutMs: 5000,
  });
  if (!fetched.reachable || (fetched.status !== undefined && fetched.status >= 400)) {
    await params.prompter.note(
      buildNvidiaDiscoveryFailureLines({
        baseUrl,
        status: fetched.status,
        error: fetched.error,
      }).join("\n"),
      NVIDIA_PROVIDER_LABEL,
    );
    throw new WizardCancelledError("NVIDIA model discovery failed");
  }

  const discoveredModels = resolveConfiguredOrSeedNvidiaModels(
    await discoverNvidiaModels({
      baseUrl,
      apiKey: normalizedApiKey ?? apiKey,
      timeoutMs: 5000,
    }),
  );
  const defaultModelId = selectDefaultNvidiaModelId(discoveredModels);
  if (!defaultModelId) {
    await params.prompter.note(
      buildNvidiaDiscoveryFailureLines({ baseUrl }).join("\n"),
      NVIDIA_PROVIDER_LABEL,
    );
    throw new WizardCancelledError("NVIDIA model discovery returned no usable models");
  }

  return {
    profiles: [
      {
        profileId: `${PROVIDER_ID}:default`,
        credential,
      },
    ],
    configPatch: buildConfiguredNvidiaState({
      config: params.config,
      existingProvider: params.config.models?.providers?.[PROVIDER_ID],
      baseUrl,
      apiKey: NVIDIA_DEFAULT_API_KEY_ENV_VAR,
      discoveredModels,
      defaultModelId,
    }),
  };
}

export async function configureNvidiaNonInteractive(
  ctx: ProviderAuthMethodNonInteractiveContext,
): Promise<codeConfig | null> {
  const requestedModelId = normalizeOptionalSecretInput(ctx.opts.customModelId);
  const resolved = await ctx.resolveApiKey({
    provider: PROVIDER_ID,
    flagValue:
      normalizeOptionalSecretInput(ctx.opts.nvidiaApiKey) ??
      normalizeOptionalSecretInput(ctx.opts.customApiKey),
    flagName:
      normalizeOptionalSecretInput(ctx.opts.nvidiaApiKey) !== undefined
        ? "--nvidia-api-key"
        : "--custom-api-key",
    envVar: NVIDIA_DEFAULT_API_KEY_ENV_VAR,
    envVarName: NVIDIA_DEFAULT_API_KEY_ENV_VAR,
    required: true,
  });

  if (!resolved?.key) {
    ctx.runtime.error(
      `NVIDIA API key is required. Set ${NVIDIA_DEFAULT_API_KEY_ENV_VAR} or pass --nvidia-api-key.`,
    );
    ctx.runtime.exit(1);
    return null;
  }

  const baseUrl = NVIDIA_DEFAULT_INFERENCE_BASE_URL;
  const fetched = await fetchNvidiaModels({
    baseUrl,
    apiKey: resolved.key,
    timeoutMs: 5000,
  });
  if (!fetched.reachable || (fetched.status !== undefined && fetched.status >= 400)) {
    ctx.runtime.error(
      buildNvidiaDiscoveryFailureLines({
        baseUrl,
        status: fetched.status,
        error: fetched.error,
      }).join("\n"),
    );
    ctx.runtime.exit(1);
    return null;
  }

  const discoveredModels = resolveConfiguredOrSeedNvidiaModels(
    await discoverNvidiaModels({
      baseUrl,
      apiKey: resolved.key,
      timeoutMs: 5000,
    }),
  );
  const selectedModelId = requestedModelId ?? selectDefaultNvidiaModelId(discoveredModels);
  const selectedModel = selectedModelId
    ? discoveredModels.find((model) => model.id === selectedModelId)
    : undefined;
  if (!selectedModelId || !selectedModel) {
    ctx.runtime.error(
      buildNvidiaDiscoveryFailureLines({
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

  const storedApiKey = resolved.source === "env" ? NVIDIA_DEFAULT_API_KEY_ENV_VAR : null;
  return buildConfiguredNvidiaState({
    config: ctx.config,
    existingProvider: ctx.config.models?.providers?.[PROVIDER_ID],
    baseUrl,
    apiKey: storedApiKey,
    discoveredModels,
    defaultModelId: selectedModelId,
  });
}

export async function discoverNvidiaProvider(
  ctx: ProviderCatalogContext,
): Promise<{ provider: ModelProviderConfig } | null> {
  const explicit = ctx.config.models?.providers?.[PROVIDER_ID];
  const explicitModels = normalizeNvidiaConfiguredCatalogEntries(explicit?.models);
  const baseUrl = resolveNvidiaInferenceBase(explicit?.baseUrl);
  const { apiKey, discoveryApiKey } = ctx.resolveProviderApiKey(PROVIDER_ID);
  const discoveredModels =
    normalizeOptionalSecretInput(discoveryApiKey ?? apiKey)
      ? await discoverNvidiaModels({
          baseUrl,
          apiKey: normalizeOptionalSecretInput(discoveryApiKey ?? apiKey),
          quiet: true,
        })
      : [];
  const models =
    discoveredModels.length > 0
      ? discoveredModels
      : explicitModels.length > 0
        ? explicitModels
        : buildNvidiaSeedModels();

  return {
    provider: buildNvidiaProviderConfig({
      existingProvider: explicit,
      baseUrl,
      apiKey:
        explicit?.apiKey ??
        (normalizeOptionalSecretInput(discoveryApiKey ?? apiKey)
          ? NVIDIA_DEFAULT_API_KEY_ENV_VAR
          : undefined),
      models,
    }),
  };
}

export async function prepareNvidiaDynamicModels(
  ctx: ProviderPrepareDynamicModelContext,
): Promise<ProviderRuntimeModel[]> {
  const baseUrl = resolveNvidiaInferenceBase(ctx.providerConfig?.baseUrl);

  let apiKey: string | undefined;
  let headers: Record<string, string> = {};
  try {
    const resolved = await resolveNvidiaRequestContext({
      config: ctx.config,
      agentDir: ctx.agentDir,
      env: process.env,
      providerHeaders: ctx.providerConfig?.headers,
    });
    apiKey = resolved.apiKey;
    headers = resolved.headers;
  } catch {
    return normalizeNvidiaConfiguredCatalogEntries(ctx.providerConfig?.models).map((model) =>
      mapNvidiaConfigToRuntimeModel(baseUrl, model),
    );
  }

  const hasAuthorizationHeader = Object.keys(headers).some(
    (headerName) => headerName.toLowerCase() === "authorization",
  );
  const discoveredModels =
    apiKey || hasAuthorizationHeader
      ? await discoverNvidiaModels({
          baseUrl,
          apiKey,
          headers,
          quiet: true,
        })
      : [];
  const fallbackModels = normalizeNvidiaConfiguredCatalogEntries(ctx.providerConfig?.models);
  const models =
    discoveredModels.length > 0
      ? discoveredModels
      : fallbackModels.length > 0
        ? fallbackModels
        : buildNvidiaSeedModels();

  return models.map((model) => mapNvidiaConfigToRuntimeModel(baseUrl, model));
}