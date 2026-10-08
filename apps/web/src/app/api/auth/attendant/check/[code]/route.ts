import { NextRequest, NextResponse } from 'next/server';
import { AtendenteRepository } from '@/server/rag/entities/atendente/repository';
import { strictLimit } from '../../../../_lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/attendant/check/:code - Verifica se o atendente possui senha local.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
    const limited = strictLimit(request);
    if (limited) return limited;

    const { code } = await params;

    const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!sanitizedCode) {
        return NextResponse.json({ success: false, error: 'Código inválido' }, { status: 400 });
    }

    const hasLocalPassword = AtendenteRepository.hasLocalPassword(sanitizedCode);

    return NextResponse.json({
        success: true,
        code: sanitizedCode,
        hasLocalPassword,
    });
}
