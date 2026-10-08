import { NextRequest, NextResponse } from 'next/server';
import { AtendenteRepository } from '@/server/rag/entities/atendente/repository';
import { generateSecureToken, registerToken, withAuthCookie } from '../../../_lib/auth';
import { getClientIp } from '../../../_lib/http';
import { strictLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/attendant/local - Autenticação local de atendente.
 */
export async function POST(request: NextRequest) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const { code, password } = body ?? {};

    if (!code || !password || typeof code !== 'string' || typeof password !== 'string') {
        return NextResponse.json(
            { success: false, error: 'Código e senha são obrigatórios' },
            { status: 400 }
        );
    }

    const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!sanitizedCode) {
        return NextResponse.json({ success: false, error: 'Código do atendente inválido' }, { status: 400 });
    }

    try {
        if (!AtendenteRepository.hasLocalPassword(sanitizedCode)) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Atendente não possui senha local configurada',
                    code: 'NO_LOCAL_PASSWORD',
                },
                { status: 404 }
            );
        }

        const result = AtendenteRepository.authenticateLocal(sanitizedCode, password);

        if (result.success && result.atendente) {
            const token = generateSecureToken();
            registerToken(token, `attendant:${sanitizedCode}`);
            logger.info('AUTH', 'Attendant local login successful', { code: sanitizedCode });

            return withAuthCookie(
                NextResponse.json({
                    success: true,
                    atendente: {
                        codigo: result.atendente.codigo,
                        nome: result.atendente.nome,
                        permissao: result.atendente.permissao,
                    },
                }),
                token
            );
        }

        logger.warn('AUTH', 'Failed local attendant login', { code: sanitizedCode, ip: getClientIp(request) });
        return NextResponse.json(
            { success: false, error: result.error || 'Senha incorreta' },
            { status: 401 }
        );
    } catch (error) {
        logger.error('AUTH', 'Error in local attendant login', {
            error: error instanceof Error ? error.message : String(error),
        });
        return NextResponse.json({ success: false, error: 'Erro interno ao autenticar' }, { status: 500 });
    }
}
