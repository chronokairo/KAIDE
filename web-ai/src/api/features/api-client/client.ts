/**
 * @layer features/api-client
 * @description Cliente genérico para consulta às APIs
 * Com suporte a cache local para evitar consultas frequentes
 */

import type { APIResult, APIClientOptions } from './types.js';
import { DEFAULT_API_OPTIONS } from './types.js';
import { getDataCache } from '../../shared/lib/data-cache.js';

// Configurações padrão
const PORT = process.env.PORT || 80;
const TOTVS_API_BASE = process.env.TOTVS_API_BASE || `http://localhost:${PORT}/api/totvs`;

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

/**
 * Cliente específico para API TOTVS
 */
export class TOTVSClient extends APIClient {
  constructor() {
    super({
      baseUrl: TOTVS_API_BASE,
      timeout: 800,
      useCache: true,
    });
  }

  async getOfertas(params?: {
    codTipoCurso?: string;
    codTipoHabilitacao?: string;
    codTipoEnsino?: string;
    curso?: string;
  }) {
    return this.get<unknown[]>('ofertas', params as Record<string, string>);
  }

  async getAreas() {
    return this.get<unknown[]>('areas');
  }

  async getNiveis() {
    return this.get<unknown[]>('niveis');
  }

  async getRankCursos() {
    return this.get<unknown[]>('rank-cursos');
  }

  async getGradeCurricular(params?: {
    codCurso?: string;
    codHabilitacao?: string;
  }) {
    return this.get<unknown[]>('grade-curricular', params as Record<string, string>);
  }

  async getAtendentes() {
    return this.get<unknown[]>('atendentes');
  }

  async getHistoricoAtendimento(codAtendente: string) {
    return this.get<unknown[]>(`atendentes/${codAtendente}/historico`);
  }

  async getTodasMatriculas() {
    return this.get<unknown[]>('atendentes/matriculas');
  }

  async getPessoaPorCpf(cpf: string) {
    return this.get<unknown>(`pessoa/cpf/${cpf}`);
  }

  /**
   * Busca em todas as APIs baseado na query
   */
  async searchAll(query: string): Promise<APIResult<unknown>[]> {
    const results: APIResult<unknown>[] = [];
    const queryLower = query.toLowerCase();

    // Identificar quais APIs consultar baseado na query
    if (
      ['curso', 'oferta', 'graduação', 'pós', 'mba', 'especialização', 'ensino'].some(
        (term) => queryLower.includes(term)
      )
    ) {
      results.push(await this.getOfertas());
      results.push(await this.getAreas());
      results.push(await this.getNiveis());
    }

    if (
      ['grade', 'disciplina', 'matéria', 'currículo', 'curricular'].some((term) =>
        queryLower.includes(term)
      )
    ) {
      results.push(await this.getGradeCurricular());
    }

    if (
      ['ranking', 'popular', 'mais procurado', 'top'].some((term) =>
        queryLower.includes(term)
      )
    ) {
      results.push(await this.getRankCursos());
    }

    if (
      ['atendente', 'atendimento', 'contato'].some((term) =>
        queryLower.includes(term)
      )
    ) {
      results.push(await this.getAtendentes());
    }

    // Consultas sobre turmas, matrículas e alunos
    if (
      ['turma', 'matrícula', 'matricula', 'inscri', 'aluno', 'candidato', 'quantos', 'quantas', 'total'].some(
        (term) => queryLower.includes(term)
      )
    ) {
      results.push(await this.getTodasMatriculas());
      results.push(await this.getOfertas());
      results.push(await this.getRankCursos());
    }

    // Se nenhum termo específico, buscar em ofertas por padrão
    if (results.length === 0) {
      results.push(await this.getOfertas());
    }

    return results.filter((r) => r.success);
  }

  /**
   * Atualiza todo o cache com dados frescos da API
   */
  async refreshAllCache(): Promise<Record<string, boolean>> {
    console.log('[TOTVSClient] Atualizando cache de todos os endpoints...');

    const endpoints = [
      { name: 'ofertas', fn: () => this.get('ofertas', undefined, true) },
      { name: 'areas', fn: () => this.get('areas', undefined, true) },
      { name: 'niveis', fn: () => this.get('niveis', undefined, true) },
      { name: 'rank-cursos', fn: () => this.get('rank-cursos', undefined, true) },
      { name: 'atendentes', fn: () => this.get('atendentes', undefined, true) },
      { name: 'grade-curricular', fn: () => this.get('grade-curricular', undefined, true) },
    ];

    const results: Record<string, boolean> = {};

    for (const { name, fn } of endpoints) {
      const result = await fn();
      results[name] = result.success;
      console.log(`  ${result.success ? '✓' : '✗'} ${name}`);
    }

    return results;
  }
}

// Singleton
let totvsClient: TOTVSClient | null = null;

export function getTOTVSClient(): TOTVSClient {
  if (!totvsClient) {
    totvsClient = new TOTVSClient();
  }
  return totvsClient;
}
