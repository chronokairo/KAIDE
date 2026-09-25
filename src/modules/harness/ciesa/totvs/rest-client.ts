/**
 * Cliente REST TOTVS (consultas SQL) — adaptado de /home/luan/GitHub/site.
 * Usado para E.OFERTAS (cursos ofertados) e E.PESSOA (consulta por CPF).
 */

import { buildTotvsRestUrl, fetchWithTimeout, getTotvsAuthHeaders, TOTVS_TIMEOUT } from './config';

export async function totvsRestRequest<T = unknown>(
  sentenca: string,
  params: Record<string, string> = {},
  timeout: number = TOTVS_TIMEOUT,
): Promise<T> {
  const url = buildTotvsRestUrl(sentenca, params);

  const response = await fetchWithTimeout(url, { method: 'GET', headers: getTotvsAuthHeaders() }, timeout);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Sentenca '${sentenca}' nao encontrada no TOTVS (404).`);
    }
    throw new Error(`TOTVS respondeu com status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/* ── Ofertas de cursos (E.OFERTAS) ─────────────────────────────────── */

export interface OfertaTotvs {
  IDPS: string | number;
  IDAREAINTERESSE: string | number;
  IDHABILITACAOFILIAL: string | number;
  IDPERLET?: string | number;
  CODCAMPUS?: string | number;
  CURSO?: string;
  NOMECURSO?: string;
  TURNO?: string;
  NOMETIPOENSINO?: string;
  NOMEPORTALINSCRICOES?: string;
  NOMEPROCESSO?: string;
  CAMPUS_NOME?: string;
  CAMPUS_BAIRRO?: string;
  CAMPUS_CIDADE?: string;
  CAMPUS_UF?: string;
  CODFILIAL?: string | number;
  CARGAHORARIA?: string | number;
  NUMEROVAGAS?: number;
  VAL_MENSAL_CURSO?: number;
  PERC_BOLSA?: number;
  PERC_PONTUAL?: number;
  [key: string]: unknown;
}

export async function buscarOfertas(
  params: {
    codTipoCurso?: string;
    codTipoHabilitacao?: string;
    codCurso?: string;
    codTipoEnsino?: string;
  } = {},
): Promise<OfertaTotvs[]> {
  const data = await totvsRestRequest<OfertaTotvs[]>('E.OFERTAS', {
    CODTIPOCURSO: params.codTipoCurso || '',
    CODTIPOHABILITACAO: params.codTipoHabilitacao || '',
    CODCURSO: params.codCurso || '',
    CODTIPOENSINO: params.codTipoEnsino || '',
  });
  return Array.isArray(data) ? data : [];
}
