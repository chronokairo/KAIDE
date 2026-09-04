/**
 * @layer features/totvs/api
 * @description Serviço de Áreas de Ensino
 */

import { totvsRestRequest } from './rest-client.js';

export interface Area {
    CODAREA: number;
    NOME: string;
}

/**
 * Buscar todas as áreas de ensino
 */
export async function buscarAreas(): Promise<Area[]> {
    return totvsRestRequest<Area[]>('E.AREA');
}
