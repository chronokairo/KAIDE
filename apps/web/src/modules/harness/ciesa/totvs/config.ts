/**
 * Configuracao da integracao TOTVS (copiada/adaptada de /home/luan/GitHub/site).
 * Credenciais via .env.local: TOTVS_BASE_URL, TOTVS_USER, TOTVS_PASSWORD.
 */

export const TOTVS_BASE_URL = process.env.TOTVS_BASE_URL || 'http://ws.seculomanaus.com.br:8051';

const TOTVS_USER = process.env.TOTVS_USER || process.env.TOTVS_USERNAME || 'site';
const TOTVS_PASSWORD = process.env.TOTVS_PASSWORD || '';

export const TOTVS_AUTH =
  process.env.TOTVS_BASIC_AUTH ||
  Buffer.from(`${TOTVS_USER}:${TOTVS_PASSWORD}`).toString('base64');

export const TOTVS_TIMEOUT = 30000;

export const SOAP_CONFIG = {
  DATA_SERVERS: {
    USUARIO: 'EduPSUsuarioData',
    PESSOA: 'EduPSPessoaData',
    INSCRICAO: 'EduPSInscricaoAreaOfertadaData',
  },
  ACTIONS: {
    READ: 'http://www.totvs.com/IwsDataServer/ReadRecord',
    SAVE: 'http://www.totvs.com/IwsDataServer/SaveRecord',
  },
  CONTEXT: {
    CODCOLIGADA: '4',
    CODFILIAL: '1',
    CODUSUARIO: 'portal',
    CODSISTEMA: 'S',
  },
} as const;

export const SOAP_ENDPOINT = '/wsDataServer/IwsDataServer';

/** Constroi URL de consulta SQL TOTVS (REST). */
export function buildTotvsRestUrl(sentenca: string, params: Record<string, string> = {}): string {
  const baseParams = { CODCOLIGADA: '4', ...params };
  const paramString =
    Object.entries(baseParams)
      .map(([k, v]) => `${k}=${encodeURIComponent(v || '')}`)
      .join(';') + ';';

  return `${TOTVS_BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/${sentenca}/0/S/?parameters=${paramString}`;
}

export function getTotvsAuthHeaders(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Basic ${TOTVS_AUTH}`,
    login: '1',
  };
}

export function getContexto(): string {
  return Object.entries(SOAP_CONFIG.CONTEXT)
    .map(([key, value]) => `${key}=${value}`)
    .join(',');
}

export async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number = TOTVS_TIMEOUT,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
}
