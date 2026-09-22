/**
 * @layer entities/atendente
 * @description Repository de Atendente (armazenamento local)
 */

import { Atendente, AtendenteAuth } from './model.js';
import { timingSafeCompare } from '../../shared/lib/crypto.js';

// Storage em memória (pode ser substituído por banco de dados)
const localPasswords = new Map<string, { senha: string; atendente: Atendente }>();

export const AtendenteRepository = {
    /**
     * Verificar se atendente tem senha local
     */
    hasLocalPassword(codigo: string): boolean {
        return localPasswords.has(codigo.toUpperCase());
    },

    /**
     * Autenticar atendente com senha local
     */
    authenticateLocal(codigo: string, senha: string): AtendenteAuth {
        const key = codigo.toUpperCase();
        const stored = localPasswords.get(key);

        if (!stored) {
            return { success: false, error: 'Atendente não encontrado' };
        }

        if (timingSafeCompare(senha, stored.senha)) {
            return { success: true, atendente: stored.atendente };
        }

        return { success: false, error: 'Senha incorreta' };
    },

    /**
     * Registrar senha local para atendente
     */
    setLocalPassword(codigo: string, senha: string, atendente: Atendente): void {
        localPasswords.set(codigo.toUpperCase(), { senha, atendente });
    },

    /**
     * Remover senha local
     */
    removeLocalPassword(codigo: string): boolean {
        return localPasswords.delete(codigo.toUpperCase());
    }
};
