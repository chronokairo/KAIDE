import { NextRequest, NextResponse } from 'next/server';
import { validateCPF } from '@/server/rag/shared/lib/validation';
import { buscarUsuarioPorCPF } from '@/server/rag/features/totvs/api/soap-client';
import { handleRouteError } from '../../../_lib/http';
import { generalLimit } from '../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/totvs/usuario/buscar - Buscar usuário por CPF para login (SOAP).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const body = await request.json().catch(() => null);
    const cpf = body?.cpf;

    if (!cpf) {
        return NextResponse.json(
            { success: false, error: 'CPF é obrigatório' },
            { status: 400 }
        );
    }

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        return NextResponse.json({ success: false, error: 'CPF inválido' }, { status: 400 });
    }

    try {
        const result = await buscarUsuarioPorCPF(cpfValidation.cleaned);

        if (result.success) {
            return NextResponse.json({
                success: true,
                codusuariops: result.codUsuarioPS,
                codPessoa: result.codPessoa,
                nome: result.nome,
            });
        }
        return NextResponse.json(
            { success: false, error: result.error || 'Usuário não encontrado' },
            { status: 404 }
        );
    } catch (error) {
        return handleRouteError(error, 'totvs/usuario/buscar');
    }
}
