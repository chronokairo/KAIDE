/**
 * @layer features/totvs/api
 * @description Serviço de Grade Curricular
 */

import { totvsRestRequest } from './rest-client.js';

export interface Disciplina {
    CODDISCIPLINA: string;
    NOMEDISCIPLINA: string;
    CARGAHORARIA: number;
    PERIODO: number;
}

/**
 * Buscar grade curricular
 */
export async function buscarGradeCurricular(params: {
    codCurso?: string;
    codHabilitacao?: string;
} = {}): Promise<Disciplina[]> {
    const queryParams: Record<string, string> = {};
    if (params.codCurso) queryParams.CODCURSO = params.codCurso;
    if (params.codHabilitacao) queryParams.CODHABILITACAO = params.codHabilitacao;
    
    return totvsRestRequest<Disciplina[]>('E.GRADE', queryParams);
}
