import { NextResponse } from 'next/server';

export async function DELETE() {
  try {
    const { clearCache } = await import('@/lib/documents/persistence');
    await clearCache();

    return NextResponse.json({
      success: true,
      message: 'Cache limpo com sucesso. Próxima requisição irá re-indexar.',
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
