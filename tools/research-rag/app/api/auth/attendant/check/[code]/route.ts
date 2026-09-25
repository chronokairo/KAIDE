import { NextResponse } from 'next/server';
import { AtendenteRepository } from '@/lib/atendente-repository';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  if (!sanitizedCode) {
    return NextResponse.json({
      success: false,
      error: 'Código inválido',
    }, { status: 400 });
  }

  const hasLocalPassword = AtendenteRepository.hasLocalPassword(sanitizedCode);

  return NextResponse.json({
    success: true,
    code: sanitizedCode,
    hasLocalPassword,
  });
}
