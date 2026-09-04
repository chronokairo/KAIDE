/**
 * @layer features/totvs/api
 * @description Serviço de Pessoa
 */

import { totvsRestRequest } from './rest-client.js';

export interface Pessoa {
    CODPESSOA: string;
    NOME: string;
    CPF: string;
    EMAIL?: string;
    TELEFONE?: string;
    DATANASCIMENTO?: string;
}

export interface PessoaCompleta extends Pessoa {
    RG?: string;
    ENDERECO?: string;
    CIDADE?: string;
    UF?: string;
    CEP?: string;
}

/**
 * Buscar pessoa por CPF
 */
export async function buscarPessoaPorCPF(cpf: string): Promise<Pessoa[]> {
    return totvsRestRequest<Pessoa[]>('E.PESSOA', { CPF: cpf });
}

/**
 * Buscar pessoa por código
 */
export async function buscarPessoaPorCodigo(codigo: string): Promise<Pessoa[]> {
    return totvsRestRequest<Pessoa[]>('E.PESSOA', { CODPESSOA: codigo });
}

/**
 * Buscar pessoa completa por CPF
 */
export async function buscarPessoaCompleta(cpf: string, codPessoa?: string): Promise<PessoaCompleta[]> {
    const params: Record<string, string> = { CPF: cpf };
    if (codPessoa) params.CODPESSOA = codPessoa;
    
    return totvsRestRequest<PessoaCompleta[]>('E.PESSOACOMP', params);
}
