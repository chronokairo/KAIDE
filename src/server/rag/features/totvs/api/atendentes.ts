/**
 * @layer features/totvs/api
 * @description Serviço de Atendentes TOTVS
 */

import { totvsRestRequest } from './rest-client.js';

export interface AtendenteTotvs {
    CODIGO: string;
    NOME: string;
    PERMISSAO: string;
}

export interface HistoricoAtendimento {
    SPSATEND: string;
    CANDIDATO_NROINSCRICAO: number;
    CODUSUARIOPS: number;
    CANDIDATO_NOME: string;
    CANDIDATO_CPF: string;
    CANDIDATO_EMAIL: string;
    TELEFONE: string;
    CANDIDATO_DTNASCIMENTO: string;
    DATAINSCRICAO: string;
    STATUS: string;
    AREA_INTERESSES: string;
    IDPS: number;
    PROCESSO: string;
    CODPESSOA: number;
    SPSATEND1: string;
    URL: string;
}

/**
 * Buscar lista de atendentes
 */
export async function buscarAtendentes(): Promise<AtendenteTotvs[]> {
    return totvsRestRequest<AtendenteTotvs[]>('E.ATENDENTE', {}, { includeColigada: false });
}

/**
 * Buscar histórico de atendimento
 */
export async function buscarHistoricoAtendimento(codAtendente: string): Promise<HistoricoAtendimento[]> {
    return totvsRestRequest<HistoricoAtendimento[]>('E.HISTATEND', {
        SPSATEND: codAtendente
    }, { includeColigada: false });
}

/**
 * Autenticar atendente no TOTVS
 */
export async function autenticarAtendenteTotvs(login: string, senha: string): Promise<AtendenteTotvs | null> {
    try {
        const data = await totvsRestRequest<AtendenteTotvs[]>('E.AUTHATENDENTE', {
            SPSATEND: login,
            SENHA: senha
        }, { includeColigada: false });

        if (data && Array.isArray(data) && data.length > 0 && data[0].CODIGO && data[0].NOME) {
            return data[0];
        }

        return null;
    } catch {
        return null;
    }
}
