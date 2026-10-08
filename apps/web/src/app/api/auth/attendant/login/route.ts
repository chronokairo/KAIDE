import { NextRequest, NextResponse } from 'next/server';
import { fetchWithTimeout, JSON_HEADERS } from '@/server/rag/shared/lib/http-core';
import { TOTVS_AUTH, TOTVS_BASE_URL, isProduction } from '@/server/rag/shared/config/environment';
import { validateCsrfToken } from '@/server/rag/features/auth/csrf-core';
import {
    SESSION_COOKIE_NAME,
    generateSecureToken,
    registerToken,
    withAuthCookie,
} from '../../../_lib/auth';
import { getClientIp } from '../../../_lib/http';
import { strictLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/attendant/login - Autenticação de atendente via TOTVS (E.AUTHATENDENTE).
 */
export async function POST(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const { code, password, csrfToken } = body ?? {};
    const sessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value;

    if (csrfToken && sessionId) {
        if (!validateCsrfToken(csrfToken, sessionId)) {
            logger.warn('CSRF', 'Invalid CSRF token on attendant login', { ip: getClientIp(request) });
            return NextResponse.json(
                { success: false, error: 'Sessão expirada. Recarregue a página.', code: 'CSRF_INVALID' },
                { status: 403 }
            );
        }
    } else if (isProduction) {
        logger.warn('CSRF', 'Missing CSRF token on attendant login', { ip: getClientIp(request) });
    }

    if (!code || typeof code !== 'string') {
        return NextResponse.json(
            { success: false, error: 'Código do atendente é obrigatório' },
            { status: 400 }
        );
    }

    const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!sanitizedCode) {
        return NextResponse.json({ success: false, error: 'Código do atendente inválido' }, { status: 400 });
    }

    try {
        const params: Record<string, string> = {
            SPSATEND: sanitizedCode,
            SENHA: password || '',
        };

        const paramString =
            Object.entries({ CODCOLIGADA: '4', ...params })
                .map(([k, v]) => `${k}=${v || ''}`)
                .join(';') + ';';

        const url = `${TOTVS_BASE_URL}/api/framework/v1/consultaSQLServer/RealizaConsulta/E.AUTHATENDENTE/0/S/?parameters=${encodeURIComponent(paramString)}`;

        const response = await fetchWithTimeout(
            url,
            {
                method: 'GET',
                headers: {
                    ...JSON_HEADERS,
                    Authorization: `Basic ${TOTVS_AUTH}`,
                    login: '1',
                },
            },
            800
        );

        if (!response.ok) {
            throw new Error(`TOTVS responded with ${response.status}`);
        }

        const data = await response.json();

        if (data && Array.isArray(data) && data.length > 0) {
            const attendantData = data[0];

            if (attendantData.CODIGO && attendantData.NOME) {
                const token = generateSecureToken();
                registerToken(token, `attendant:${sanitizedCode}`);
                logger.info('AUTH', 'Attendant login successful', { code: sanitizedCode });

                return withAuthCookie(
                    NextResponse.json({
                        success: true,
                        data: [
                            {
                                CODIGO: attendantData.CODIGO,
                                NOME: attendantData.NOME,
                            },
                        ],
                        message: 'Login realizado com sucesso',
                    }),
                    token
                );
            }
        }

        logger.warn('AUTH', 'Attendant login failed - invalid credentials', {
            code: sanitizedCode,
            ip: getClientIp(request),
        });
        return NextResponse.json({ success: false, error: 'Credenciais inválidas' }, { status: 401 });
    } catch (error) {
        logger.error('AUTH', `Attendant login error: ${error instanceof Error ? error.message : String(error)}`, {
            code: sanitizedCode,
        });
        return NextResponse.json(
            { success: false, error: 'Erro ao autenticar. Tente novamente.' },
            { status: 500 }
        );
    }
}
