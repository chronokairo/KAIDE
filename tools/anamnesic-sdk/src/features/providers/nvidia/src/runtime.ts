import {
  isKnownEnvApiKeyMarker,
  normalizeApiKeyConfig,
  normalizeOptionalSecretInput,
  type codeConfig,
} from "code/plugin-sdk/provider-auth";
import { resolveApiKeyForProvider } from "code/plugin-sdk/provider-auth-runtime";
import { resolveConfiguredSecretInputString } from "code/plugin-sdk/secret-input-runtime";
import { NVIDIA_DEFAULT_API_KEY_ENV_VAR, NVIDIA_PROVIDER_ID } from "./defaults.js";

type NvidiaAuthHeadersParams = {
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

export function buildNvidiaAuthHeaders(params: NvidiaAuthHeadersParams): Record<string, string> {
  const headers: Record<string, string> = { ...(params.headers ?? {}) };

  const apiKey = params.apiKey?.trim();
  if (apiKey) {
    for (const headerName of Object.keys(headers)) {
      if (headerName.toLowerCase() === "authorization") {
        delete headers[headerName];
      }
    }
    headers.Authorization = `Bearer ${apiKey}`;
  }
  if (params.json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

export async function resolveNvidiaConfiguredApiKey(params: {
  config?: codeConfig;
  env?: NodeJS.ProcessEnv;
  path?: string;
}): Promise<string | undefined> {
  const providerConfig = params.config?.models?.providers?.[NVIDIA_PROVIDER_ID];
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

  const path = params.path ?? "models.providers.nvidia.apiKey";
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

export async function resolveNvidiaProviderHeaders(params: {
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

  const pathPrefix = params.path ?? "models.providers.nvidia.headers";
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

export async function resolveNvidiaRuntimeApiKey(params: {
  config?: codeConfig;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
}): Promise<string | undefined> {
  if (!params.config) {
    return undefined;
  }

  const resolveConfiguredApiKeyOrThrow = async () => {
    const configuredApiKey = await resolveNvidiaConfiguredApiKey({
      config: params.config,
      env: params.env,
    });
    if (configuredApiKey) {
      return configuredApiKey;
    }
    const envMarker = `\${${NVIDIA_DEFAULT_API_KEY_ENV_VAR}}`;
    throw new Error(
      [
        "NVIDIA API key is required.",
        `Set models.providers.nvidia.apiKey (for example \"${envMarker}\")`,
        'or run "code models auth nvidia".',
      ].join(" "),
    );
  };

  try {
    const resolved = await resolveApiKeyForProvider({
      provider: NVIDIA_PROVIDER_ID,
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

export async function resolveNvidiaRequestContext(params: {
  config?: codeConfig;
  agentDir?: string;
  env?: NodeJS.ProcessEnv;
  providerHeaders?: unknown;
}): Promise<{ apiKey: string | undefined; headers: Record<string, string> }> {
  const providerHeaders =
    params.providerHeaders ?? params.config?.models?.providers?.[NVIDIA_PROVIDER_ID]?.headers;
  const [apiKey, headers] = await Promise.all([
    resolveNvidiaRuntimeApiKey({
      config: params.config,
      agentDir: params.agentDir,
      env: params.env,
    }),
    resolveNvidiaProviderHeaders({
      config: params.config,
      env: params.env,
      headers: providerHeaders,
    }),
  ]);

  return {
    apiKey,
    headers: buildNvidiaAuthHeaders({ apiKey, headers }),
  };
}