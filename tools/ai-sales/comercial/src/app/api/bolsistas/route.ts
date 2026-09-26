import { NextResponse } from 'next/server';
import { buscarBolsistas } from '@/lib/bolsistas';

/**
 * GET /api/bolsistas?nome=&curso=&turno=&limit=
 * Consulta os bolsistas do CIESA no portal público da Prefeitura de Manaus.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const nome = searchParams.get('nome') ?? undefined;
  const curso = searchParams.get('curso') ?? undefined;
  const turno = searchParams.get('turno') ?? undefined;
  const limitParam = parseInt(searchParams.get('limit') ?? '', 10);
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 500) : 50;

  try {
    const results = await buscarBolsistas({ nome, curso, turno });
    return NextResponse.json({
      total: results.length,
      exibindo: Math.min(results.length, limit),
      bolsistas: results.slice(0, limit),
      fonte: 'Portal de Denúncias de Bolsas Universitárias — Prefeitura de Manaus (SGBU)',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `Falha ao consultar o portal de bolsistas: ${msg}` },
      { status: 502 },
    );
  }
}
