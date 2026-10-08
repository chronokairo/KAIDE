import { NextRequest, NextResponse } from 'next/server';
import { validateCPF } from '@/server/rag/shared/lib/validation';
import { totvsRestRequest } from '@/server/rag/features/totvs/api/rest-client';
import { authenticate, auditLog, authRequiredResponse } from '../../../../../_lib/auth';
import { getClientIp, handleRouteError } from '../../../../../_lib/http';
import { generalLimit, personDataLimit, strictLimit } from '../../../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/pessoa/completa/cpf/:cpf - Consulta completa de pessoa por CPF (protegida).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cpf: string }> }
) {
    const limited = generalLimit(request) ?? strictLimit(request) ?? personDataLimit(request);
    if (limited) return limited;

    const userId = authenticate(request, request.nextUrl.pathname);
    if (!userId) return authRequiredResponse();
    auditLog(request);

    const { cpf } = await params;
    const codPessoa = request.nextUrl.searchParams.get('codPessoa') ?? '';

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        logger.warn('API', `CPF inválido: ${cpf}`, { ip: getClientIp(request) });
        return NextResponse.json(
            { success: false, error: 'CPF inválido', code: 'INVALID_CPF' },
            { status: 400 }
        );
    }

    try {
        const params2: Record<string, string> = { CPF: cpfValidation.cleaned };
        if (codPessoa) params2.CODPESSOA = codPessoa;

        const data = await totvsRestRequest('E.PESSOACOMP', params2);
        return NextResponse.json(data);
    } catch (error) {
        return handleRouteError(error, `totvs/pessoa/completa/cpf/${cpfValidation.cleaned}`);
    }
}
