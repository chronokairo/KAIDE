import { NextRequest, NextResponse } from 'next/server';
import { clearCache } from '@/server/rag/features/documents/persistence';
import { generalLimit } from '../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * DELETE /api/chat/cache - Limpa o cache persistido.
 */
export async function DELETE(request: NextRequest) {
    const limited = generalLimit(request);
    if (limited) return limited;

    try {
        await clearCache();
        return NextResponse.json({
            success: true,
            message: 'Cache limpo com sucesso. Próxima requisição irá re-indexar.',
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
