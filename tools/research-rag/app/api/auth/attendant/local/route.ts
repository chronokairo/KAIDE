import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import {
  generateSecureToken,
  registerToken,
  setAuthCookie,
} from '@/lib/session';
import { AtendenteRepository } from '@/lib/atendente-repository';

export async function POST(request: NextRequest) {
  const { code, password } = await request.json();

  if (!code || !password || typeof code !== 'string' || typeof password !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Código e senha são obrigatórios',
    }, { status: 400 });
  }

  const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
  if (!sanitizedCode) {
    return NextResponse.json({
      success: false,
      error: 'Código do atendente inválido',
    }, { status: 400 });
  }

  try {
    if (!AtendenteRepository.hasLocalPassword(sanitizedCode)) {
      return NextResponse.json({
        success: false,
        error: 'Atendente não possui senha local configurada',
        code: 'NO_LOCAL_PASSWORD',
      }, { status: 404 });
    }

    const result = AtendenteRepository.authenticateLocal(sanitizedCode, password);

    if (result.success && result.atendente) {
      const token = generateSecureToken();
      registerToken(token, `attendant:${sanitizedCode}`);

      const response = NextResponse.json({
        success: true,
        atendente: {
          codigo: result.atendente.codigo,
          nome: result.atendente.nome,
          permissao: result.atendente.permissao,
        },
      });

      setAuthCookie(response, token);
      logger.info('AUTH', 'Attendant local login successful', { code: sanitizedCode });
      return response;
    }

    logger.warn('AUTH', 'Failed local attendant login', { code: sanitizedCode });
    return NextResponse.json({
      success: false,
      error: result.error || 'Senha incorreta',
    }, { status: 401 });
  } catch (error: any) {
    logger.error('AUTH', 'Error in local attendant login', { error: error.message });
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao autenticar',
    }, { status: 500 });
  }
}
