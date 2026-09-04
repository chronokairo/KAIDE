/**
 * @layer entities/atendente
 * @description Modelo de Atendente
 */

export interface Atendente {
    codigo: string;
    nome: string;
    permissao?: string;
    senha?: string;
}

export interface AtendenteAuth {
    success: boolean;
    atendente?: Atendente;
    error?: string;
}
