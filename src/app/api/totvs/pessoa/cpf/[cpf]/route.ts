import { NextRequest, NextResponse } from 'next/server';
import { validateCPF } from '@/server/rag/shared/lib/validation';
import { consultarPessoaPorCPF } from '@/server/rag/features/totvs/api/soap-client';
import { handleRouteError } from '../../../../_lib/http';
import { generalLimit } from '../../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/totvs/pessoa/cpf/:cpf - Consultar pessoa por CPF (SOAP).
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ cpf: string }> }
) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const { cpf } = await params;

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        return NextResponse.json(
            { success: false, error: 'CPF inválido', code: 'INVALID_CPF' },
            { status: 400 }
        );
    }

    try {
        const result = await consultarPessoaPorCPF(cpfValidation.cleaned);

        if (result.success && result.pessoa) {
            return NextResponse.json([
                {
                    CODUSUARIOPS: result.pessoa.CODUSUARIOPS,
                    CODUSUARIO_PS: result.pessoa.CODUSUARIOPS,
                    codUsuarioPS: result.pessoa.CODUSUARIOPS,
                    CODPESSOA: result.pessoa.CODPESSOA,
                    CODIGO: result.pessoa.CODPESSOA,
                    NOME: result.pessoa.NOME,
                    CPF: result.pessoa.CPF,
                },
            ]);
        }
        return NextResponse.json([]);
    } catch (error) {
        return handleRouteError(error, `totvs/pessoa/cpf/${cpfValidation.cleaned}`);
    }
}
