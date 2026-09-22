/**
 * @layer features/totvs/api
 * @description Serviço de Níveis de Ensino
 */

import { totvsRestRequest } from './rest-client.js';

export interface Nivel {
    CODTIPOCURSO: number;
    NIVEL_ENSINO: string;
}

export interface RankCurso {
    CODCURSO: string;
    NOME: string;
    QTD: number;
}

/**
 * Buscar todos os níveis de ensino
 */
export async function buscarNiveis(): Promise<Nivel[]> {
    return totvsRestRequest<Nivel[]>('E.NIVEL');
}

/**
 * Buscar ranking de cursos
 */
export async function buscarRankCurso(): Promise<RankCurso[]> {
    return totvsRestRequest<RankCurso[]>('E.RANKCURSO');
}
