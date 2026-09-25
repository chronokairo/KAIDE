/**
 * @layer features/api-client
 * @description Cliente genérico para consulta às APIs
 * Com suporte a cache local para evitar consultas frequentes
 */

import type { APIResult, APIClientOptions } from './types.js';
import { DEFAULT_API_OPTIONS } from './types.js';
import { getDataCache } from '../../shared/lib/data-cache.js';

export class APIClient {
  private baseUrl: string;
  private timeout: number;
  private useCache: boolean;
  private cacheTTL: number;
  private source: string;

  constructor(options: APIClientOptions) {
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout ?? DEFAULT_API_OPTIONS.timeout!;
    this.useCache = options.useCache ?? DEFAULT_API_OPTIONS.useCache!;
    this.cacheTTL = options.cacheTTL ?? DEFAULT_API_OPTIONS.cacheTTL!;
    this.source = new URL(options.baseUrl).hostname || 'api';
  }

  /**
   * Tenta obter dados do cache
   */
  private getFromCache<T>(endpoint: string): APIResult<T> | null {
    if (!this.useCache) {
      return null;
    }

    const cache = getDataCache();
    const entry = cache.get(`${this.source}:${endpoint}`) as T | undefined;

    if (entry !== undefined) {
      return {
        success: true,
        data: entry,
        source: this.source,
        endpoint,
        fromCache: true,
      };
    }

    return null;
  }

  /**
   * Salva dados no cache
   */
  private saveToCache<T>(endpoint: string, data: T): void {
    if (this.useCache) {
      const cache = getDataCache();
      cache.set(`${this.source}:${endpoint}`, data, this.cacheTTL);
    }
  }

  /**
   * Faz uma requisição HTTP GET
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    forceRefresh = false
  ): Promise<APIResult<T>> {
    // Tentar cache primeiro
    if (!forceRefresh && !params) {
      const cached = this.getFromCache<T>(endpoint);
      if (cached) {
        return cached;
      }
    }

    try {
      const url = new URL(`${this.baseUrl}/${endpoint}`);

      if (params) {
        for (const [key, value] of Object.entries(params)) {
          if (value) {
            url.searchParams.set(key, value);
          }
        }
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;

      // Salvar no cache se for consulta sem filtros
      if (!params) {
        this.saveToCache(endpoint, data);
      }

      return {
        success: true,
        data,
        source: this.source,
        endpoint,
      };
    } catch (error) {
      // Tentar fallback do cache
      const cached = this.getFromCache<T>(endpoint);
      if (cached) {
        console.log(`[APIClient] API offline, usando cache para ${endpoint}`);
        return cached;
      }

      return {
        success: false,
        data: null,
        source: this.source,
        endpoint,
        error: String(error),
      };
    }
  }

  /**
   * Faz uma requisição HTTP POST
   */
  async post<T, B = unknown>(
    endpoint: string,
    body: B
  ): Promise<APIResult<T>> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as T;

      return {
        success: true,
        data,
        source: this.source,
        endpoint,
      };
    } catch (error) {
      return {
        success: false,
        data: null,
        source: this.source,
        endpoint,
        error: String(error),
      };
    }
  }
}


