/**
 * @layer features/totvs/api
 * @description Configuração da API TOTVS
 */

import { TOTVS_BASE_URL, TOTVS_AUTH, isDevelopment } from '../../../shared/config/environment.js';

export const TOTVS_CONFIG = {
    BASE_URL: TOTVS_BASE_URL,
    AUTH: TOTVS_AUTH,
    TIMEOUT: 5000,
    HEADERS: {
        REST: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        SOAP: {
            'Content-Type': 'text/xml; charset=utf-8',
            'Accept': 'text/xml'
        }
    }
};

/**
 * Constrói URL de consulta SQL TOTVS
 */
export function buildTotvsRestUrl(sentenca: string, params: Record<string, string> = {}): string {
    const baseParams = { CODCOLIGADA: '4', ...params };
    const paramString = Object.keys(baseParams).length > 0
        ? Object.entries(baseParams).map(([k, v]) => `${k}=${encodeURIComponent(v || '')}`).join(';') + ';'
        : '';

    return `${TOTVS_CONFIG.BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/${sentenca}/0/S/?parameters=${paramString}`;
}

/**
 * Headers de autenticação TOTVS
 */
export function getTotvsAuthHeaders() {
    if (!TOTVS_CONFIG.AUTH) {
        console.error('⚠️ TOTVS_AUTH não configurado!');
    }
    return {
        ...TOTVS_CONFIG.HEADERS.REST,
        'Authorization': `Basic ${TOTVS_CONFIG.AUTH}`
    };
}
