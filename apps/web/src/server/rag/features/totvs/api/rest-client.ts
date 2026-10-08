/**
 * @layer features/totvs/api
 * @description Cliente REST para TOTVS
 */

import { fetchWithTimeout } from '../../../shared/lib/http-core.js';
import { logger } from '../../../shared/lib/logger.js';
import { buildTotvsRestUrl, getTotvsAuthHeaders, TOTVS_CONFIG } from './config.js';

export interface TotvsRestOptions {
    includeColigada?: boolean;
    timeout?: number;
}

/**
 * Faz requisição REST para TOTVS
 */
export async function totvsRestRequest<T = any>(
    sentenca: string,
    params: Record<string, string> = {},
    options: TotvsRestOptions = {}
): Promise<T> {
    const { includeColigada = true, timeout = TOTVS_CONFIG.TIMEOUT } = options;

    const finalParams = includeColigada
        ? params
        : Object.fromEntries(Object.entries(params).filter(([k]) => k !== 'CODCOLIGADA'));

    const url = buildTotvsRestUrl(sentenca, includeColigada ? params : finalParams);
    const headers = getTotvsAuthHeaders();

    logger.request('TOTVS', `Request: ${sentenca}`, {
        url,
        params,
        auth: headers.Authorization ? 'SET' : 'NOT SET',
        authValue: headers.Authorization?.substring(0, 20) + '...'
    });

    const startTime = Date.now();

    try {
        const response = await fetchWithTimeout(url, {
            method: 'GET',
            headers
        }, timeout);

        const duration = Date.now() - startTime;

        if (!response.ok) {
            logger.error('TOTVS', `Erro ${response.status} em ${sentenca}`, { duration, url });
            throw new Error(`TOTVS responded with ${response.status}`);
        }

        logger.info('TOTVS', `Sucesso: ${sentenca} (${duration}ms)`, { duration });
        return response.json() as Promise<T>;
    } catch (error: any) {
        const duration = Date.now() - startTime;

        if (error.cause) {
            logger.error('TOTVS', `Erro de rede em ${sentenca}: ${error.message}`, {
                duration,
                url,
                cause: error.cause?.code || error.cause?.message || 'unknown',
                errno: error.cause?.errno,
                syscall: error.cause?.syscall,
                hostname: error.cause?.hostname
            });
        } else {
            logger.error('TOTVS', `Erro em ${sentenca}: ${error.message}`, { duration, url });
        }
        throw error;
    }
}
