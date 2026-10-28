import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const REQUIRED_ENV = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'] as const;

/**
 * GET /api/ready - Readiness: verifica configuração obrigatória e alcance do Supabase.
 * Não expõe valores de segredos, apenas nomes ausentes.
 */
export async function GET() {
    const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
    if (missing.length > 0) {
        return NextResponse.json({ ready: false, missing }, { status: 503 });
    }
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
            headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY as string },
            signal: AbortSignal.timeout(3000),
            cache: 'no-store',
        });
        if (!res.ok) {
            return NextResponse.json({ ready: false, supabase: res.status }, { status: 503 });
        }
        return NextResponse.json({ ready: true });
    } catch {
        return NextResponse.json({ ready: false, supabase: 'unreachable' }, { status: 503 });
    }
}
