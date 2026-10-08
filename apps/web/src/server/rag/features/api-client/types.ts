/**
 * @layer features/api-client
 * @description Tipos e interfaces do cliente de APIs
 */

export interface APIResult<T = unknown> {
  success: boolean;
  data: T | null;
  source: string;
  endpoint: string;
  error?: string;
  fromCache?: boolean;
}

export interface APIClientOptions {
  baseUrl: string;
  timeout?: number;
  useCache?: boolean;
  cacheTTL?: number;
}

export const DEFAULT_API_OPTIONS: Partial<APIClientOptions> = {
  timeout: 800,
  useCache: true,
  cacheTTL: 300, // 5 minutes
};
