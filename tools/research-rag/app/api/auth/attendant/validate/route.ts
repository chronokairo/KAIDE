import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { timingSafeCompare } from '@/lib/crypto';
import { validateCsrfToken } from '@/lib/csrf';
import {
  isProduction,
  ATTENDANT_INITIAL_PASSWORD,
} from '@/lib/environment';
import {
  generateSecureToken,
  registerToken,
  setAuthCookie,
  SESSION_COOKIE_NAME,
} from '@/lib/session';

export async function POST(request: NextRequest) {
  const { code, password, csrfToken } = await request.json();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (csrfToken && sessionId) {
    if (!validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('CSRF', 'Invalid CSRF token on attendant validate');
      return NextResponse.json({
        success: false,
        error: 'Sessão expirada. Recarregue a página.',
        code: 'CSRF_INVALID',
      }, { status: 403 });
    }
  } else if (isProduction) {
    logger.warn('CSRF', 'Missing CSRF token on attendant validate');
  }

  if (!code || !password || typeof password !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Dados inválidos',
    }, { status: 400 });
  }

  if (!ATTENDANT_INITIAL_PASSWORD) {
    logger.warn('AUTH', 'Attendant validation attempt but ATTENDANT_INITIAL_PASSWORD not configured');
    return NextResponse.json({
      success: false,
      error: 'Sistema de login não configurado',
    }, { status: 503 });
  }

  if (timingSafeCompare(password, ATTENDANT_INITIAL_PASSWORD)) {
    const token = generateSecureToken();
    registerToken(token, `attendant:${code}`);

    const response = NextResponse.json({
      success: true,
      message: 'Senha validada com sucesso',
    });

    setAuthCookie(response, token);
    logger.info('AUTH', 'Attendant initial password validated', { code });
    return response;
  }

  logger.warn('AUTH', 'Failed attendant password validation', { code });
  return NextResponse.json({
    success: false,
    error: 'Senha incorreta',
  }, { status: 401 });
}
