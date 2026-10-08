import { NextRequest, NextResponse } from 'next/server';
import { validateCPF } from '@/server/rag/shared/lib/validation';
import {
    cadastrarPessoa,
    DadosPessoa,
} from '@/server/rag/features/totvs/api/soap-client';
import { handleRouteError } from '../../../_lib/http';
import { generalLimit } from '../../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/totvs/pessoa/cadastrar - Cadastrar pessoa (SOAP).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const dados = (await request.json().catch(() => null)) as DadosPessoa | null;

    if (!dados?.cpf || !dados.nome || !dados.email) {
        return NextResponse.json(
            { success: false, error: 'CPF, nome e email são obrigatórios', code: 'INVALID_DATA' },
            { status: 400 }
        );
    }

    const cpfValidation = validateCPF(dados.cpf);
    if (!cpfValidation.valid) {
        return NextResponse.json(
            { success: false, error: 'CPF inválido', code: 'INVALID_CPF' },
            { status: 400 }
        );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
        return NextResponse.json(
            { success: false, error: 'Email inválido', code: 'INVALID_EMAIL' },
            { status: 400 }
        );
    }

    try {
        const result = await cadastrarPessoa({
            ...dados,
            cpf: cpfValidation.cleaned,
        });

        if (result.success) {
            logger.info('TOTVS', `Pessoa cadastrada: CPF ${cpfValidation.cleaned.slice(0, 3)}***`);
            return NextResponse.json({
                success: true,
                codUsuarioPS: result.codUsuarioPS,
                message: result.error || 'Cadastro realizado com sucesso',
            });
        }
        return NextResponse.json(
            { success: false, error: result.error || 'Erro ao cadastrar pessoa' },
            { status: 400 }
        );
    } catch (error) {
        return handleRouteError(error, 'totvs/pessoa/cadastrar');
    }
}
