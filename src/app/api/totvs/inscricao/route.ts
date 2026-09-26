import { NextRequest, NextResponse } from 'next/server';
import { realizarInscricao, DadosInscricao } from '@/server/rag/features/totvs/api/soap-client';
import { handleRouteError } from '../../_lib/http';
import { generalLimit } from '../../_lib/rate-limit';
import { logger } from '@/server/rag/shared/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/totvs/inscricao - Realizar inscrição (SOAP).
 */
export async function POST(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    const dados = (await request.json().catch(() => null)) as DadosInscricao | null;

    if (!dados?.codUsuarioPS) {
        return NextResponse.json(
            { success: false, error: 'Código do usuário PS é obrigatório', code: 'MISSING_USER' },
            { status: 400 }
        );
    }

    if (
        !dados.selectedCourseData?.IDPS ||
        !dados.selectedCourseData?.IDAREAINTERESSE ||
        !dados.selectedCourseData?.IDHABILITACAOFILIAL
    ) {
        return NextResponse.json(
            {
                success: false,
                error: 'Dados do curso incompletos (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL)',
                code: 'INVALID_COURSE_DATA',
            },
            { status: 400 }
        );
    }

    try {
        const result = await realizarInscricao(dados);

        if (result.success) {
            logger.info('TOTVS', `Inscrição realizada: ${result.numeroInscricao || 'OK'}`);
            return NextResponse.json({
                success: true,
                numeroInscricao: result.numeroInscricao,
                message: 'Inscrição realizada com sucesso',
            });
        }
        return NextResponse.json(
            { success: false, error: result.error || 'Erro ao realizar inscrição' },
            { status: 400 }
        );
    } catch (error) {
        return handleRouteError(error, 'totvs/inscricao');
    }
}
