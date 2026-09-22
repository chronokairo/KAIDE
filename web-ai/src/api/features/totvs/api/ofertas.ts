/**
 * @layer features/totvs/api
 * @description Serviço de Ofertas de Cursos
 */

import { totvsRestRequest } from './rest-client.js';

export interface Oferta {
    CODCOLIGADA: number;
    CODHABILITACAO: string;
    CODTIPOCURSO: number;
    IDHABILITACAOFILIAL: number;
    CODFILIAL: number;
    IDAREAINTERESSE: number;
    IDPS: number;
    NIVEL_ENSINO: string;
    NOMEPORTALINSCRICOES: string;
    NOMEPROCESSO: string;
    CODTIPOHABILITACAO: string;
    TIPOHABILITACAO: string;
    CODTIPOENSINO: string;
    NOMETIPOENSINO: string;
    PERIODO: string;
    CODCURSO: string;
    CODTURNO: number;
    NOME: string;
    CODGRADE: string;
    CURSO: string;
    TURNO: string;
    CODCAMPUS: string;
    VAL_MENSAL_CURSO: number;
    VAL_TAXA_CURSO: number;
    PERC_BOLSA: number;
    PERC_PONTUAL: number;
    CAMPUS_NOME: string;
    CAMPUS_BAIRRO: string;
    CAMPUS_CIDADE: string;
    CAMPUS_UF: string;
    CAMPUS_CEP: string;
    IDPERLET: number;
    CODPLANOPGTO: string;
}

/**
 * Buscar ofertas de cursos
 */
export async function buscarOfertas(params: {
    codTipoCurso?: string;
    codTipoHabilitacao?: string;
    codCurso?: string;
    codTipoEnsino?: string;
} = {}): Promise<Oferta[]> {
    return totvsRestRequest<Oferta[]>('E.OFERTAS', {
        CODTIPOCURSO: params.codTipoCurso || '',
        CODTIPOHABILITACAO: params.codTipoHabilitacao || '',
        CODCURSO: params.codCurso || '',
        CODTIPOENSINO: params.codTipoEnsino || ''
    });
}
