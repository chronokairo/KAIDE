import {
  isKnownEnvApiKeyMarker,
  normalizeApiKeyConfig,
  normalizeOptionalSecretInput,
  type codeConfig,
} from "code/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "code/plugin-sdk/provider-auth-runtime";
import { resolveConfiguredSecretInputString } from "code/plugin-sdk/secret-input-runtime";
import {
  ANTHROPIC_DEFAULT_API_KEY_ENV_VAR,
  ANTHROPIC_PROVIDER_ID,
  ANTHROPIC_VERSION,
} from "./defaults.js";

type AnthropicAuthHeadersParams = {
  apiKey?: string;
  json?: boolean;
  headers?: Record<string, string>;
};

function sanitizeStringHeaders(headers: unknown): Record<string, string> | undefined {
  if (!headers || typeof headers !== "object" || Array.isArray(headers)) {
    return undefined;
  }
  const next: Record<string, string> = {};
  for (const [headerName, headerValue] of Object.entries(headers)) {
    if (typeof headerValue !== "string") {
      continue;
    }
    const normalized = headerValue.trim();
    if (!normalized) {
      continue;
    }
    next[headerName] = normalized;
  }
  return Object.keys(next).length > 0 ? next : undefined;
}

export function buildAnthropicAuthHeaders(
  params: AnthropicAuthHeadersParams,
): Record<string, string> {
  const headers: Record<string, string> = { ...(params.headers ?? {}) };

  const apiKey = params.apiKey?.trim();
  if (apiKey) {
    for (const headerName of Object.keys(headers)) {
      const normalizedHeaderName = headerName.toLowerCase();
      if (normalizedHeaderName === "x-api-key" || normalizedHeaderName === "authorization") {
        delete headers[headerName];
      }
    }
    headers["x-api-key"] = apiKey;
  }
  if (!Object.keys(headers).some((headerName) => headerName.toLowerCase() === "anthropic-version")) {
    headers["anthropic-version"] = ANTHROPIC_VERSION;
  }
  if (params.json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export async function resolveAnthropicConfiguredApiKey(params: {
  config?: codeConfig;
  env?: NodeJS.ProcessEnv;
  path?: string;
}): Promise<string | undefined> {
  const providerConfig = params.config?.models?.providers?.[ANTHROPIC_PROVIDER_ID];
  const apiKeyInput = providerConfig?.apiKey;
  if (apiKeyInput === undefined || apiKeyInput === null) {
    return undefined;
  }

  const directApiKey = normalizeOptionalSecretInput(apiKeyInput);
  if (directApiKey !== undefined) {
    const trimmed = normalizeApiKeyConfig(directApiKey).trim();
    if (!trimmed) {
      return undefined;
    }
    if (isKnownEnvApiKeyMarker(trimmed)) {
      return normalizeOptionalSecretInput((params.env ?? process.env)[trimmed]);
    }
    return trimmed;
  }

  if (!params.config) {
    return undefined;
  }

  const path = params.path ?? "models.providers.anthropic.apiKey";
  const resolved = await resolveConfiguredSecretInputString({
    config: params.config,
    env: params.env ?? process.env,
    value: apiKeyInput,
    path,
    unresolvedReasonStyle: "detailed",
  });
  if (resolved.unresolvedRefReason) {
    throw new Error(`${path}: ${resolved.unresolvedRefReason}`);
  }

  const resolvedValue = normalizeOptionalSecretInput(resolved.value);
  const trimmedResolvedValue = resolvedValue ? normalizeApiKeyConfig(resolvedValue).trim() : "";
  return trimmedResolvedValue || undefined;
}

export async function resolveAnthropicProviderHeaders(params: {
  config?: codeConfig;
  env?: NodeJS.ProcessEnv;
  headers?: unknown;
  path?: string;
}): Promise<Record<string, string> | undefined> {
  if (!params.config) {
    return sanitizeStringHeaders(params.headers);
  }
  if (!params.headers || typeof params.headers !== "object" || Array.isArray(params.headers)) {
    return undefined;
  }

  const pathPrefix = params.path ?? "models.providers.anthropic.headers";
  const resolved: Record<string, string> = {};
  for (const [headerName, headerValue] of Object.entries(params.headers)) {
    const resolvedHeader = await resolveConfiguredSecretInputString({
      config: params.config,
      env: params.env ?? process.env,
      value: headerValue,
      path: `${pathPrefix}.${headerName}`,
      unresolvedReasonStyle: "detailed",
    });
    if (resolvedHeader.unresolvedRefReason) {
      throw new Error(`${pathPrefix}.${headerName}: ${resolvedHeader.unresolvedRefReason}`);
    }
    const resolvedValue = resolvedHeader.value?.trim();
    if (!resolvedValue) {
      continue;
    }
    resolved[headerName] = resolvedValue;
  }

  return Object.keys(resolved).length > 0 ? resolved : undefined;
}

export async function resolveAnthropicRuntimeApiKey(params: {
  config?: codeConfig;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<string | undefined> {
  if (!params.config) {
    return undefined;
  }

  const resolveConfiguredApiKeyOrThrow = async () => {
    const configuredApiKey = await resolveAnthropicConfiguredApiKey({
      config: params.config,
      env: params.env,
    });
    if (configuredApiKey) {
      return configuredApiKey;
    }
    const envMarker = `\${${ANTHROPIC_DEFAULT_API_KEY_ENV_VAR}}`;
    throw new Error(
      [
        "Anthropic API key is required.",
        `Set models.providers.anthropic.apiKey (for example \"${envMarker}\")`,
        'or run "code models auth anthropic".',
      ].join(" "),
    );
  };

  try {
    const resolved = await resolveApiKeyForProvider({
      provider: ANTHROPIC_PROVIDER_ID,
      cfg: params.config,
      agentDir: params.agentDir,
    });
    const apiKey = resolved.apiKey?.trim();
    if (apiKey) {
      return apiKey;
    }
  } catch {
    return await resolveConfiguredApiKeyOrThrow();
  }

  return await resolveConfiguredApiKeyOrThrow();
}

export async function resolveAnthropicRequestContext(params: {
  config?: codeConfig;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
  providerHeaders?: unknown;
}): Promise<{ apiKey: string | undefined; headers: Record<string, string> }> {
  const providerHeaders =
    params.providerHeaders ?? params.config?.models?.providers?.[ANTHROPIC_PROVIDER_ID]?.headers;
  const [apiKey, headers] = await Promise.all([
    resolveAnthropicRuntimeApiKey({
      config: params.config,
      agentDir: params.agentDir,
      env: params.env,
    }),
    resolveAnthropicProviderHeaders({
      config: params.config,
      env: params.env,
      headers: providerHeaders,
    }),
  ]);

  return {
    apiKey,
    headers: buildAnthropicAuthHeaders({ apiKey, headers }),
  };
}