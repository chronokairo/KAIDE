import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';
import { timingSafeCompare } from '@/lib/crypto';
import { validateCsrfToken } from '@/lib/csrf';
import {
  isProduction,
  ADMIN_USERNAME,
  ADMIN_PASSWORD,
} from '@/lib/environment';
import {
  generateSecureToken,
  registerToken,
  setAuthCookie,
  SESSION_COOKIE_NAME,
} from '@/lib/session';

export async function POST(request: NextRequest) {
  const { username, password, csrfToken } = await request.json();
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (csrfToken && sessionId) {
    if (!validateCsrfToken(csrfToken, sessionId)) {
      logger.warn('CSRF', 'Invalid CSRF token on admin login');
      return NextResponse.json({
        success: false,
        error: 'Sessão expirada. Recarregue a página.',
        code: 'CSRF_INVALID',
      }, { status: 403 });
    }
  } else if (isProduction) {
    logger.warn('CSRF', 'Missing CSRF token on admin login');
  }

  if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
    return NextResponse.json({
      success: false,
      error: 'Credenciais inválidas',
    }, { status: 400 });
  }

  if (!ADMIN_PASSWORD) {
    logger.warn('AUTH', 'Admin login attempt but ADMIN_PASSWORD not configured');
    return NextResponse.json({
      success: false,
      error: 'Sistema de login não configurado',
    }, { status: 503 });
  }

  const usernameValid = timingSafeCompare(username, ADMIN_USERNAME);
  const passwordValid = timingSafeCompare(password, ADMIN_PASSWORD);

  if (usernameValid && passwordValid) {
    const token = generateSecureToken();
    registerToken(token, `admin:${username}`);

    const response = NextResponse.json({
      success: true,
      message: 'Login realizado com sucesso',
    });

    setAuthCookie(response, token);
    logger.info('AUTH', 'Admin login successful', { username });
    return response;
  }

  logger.warn('AUTH', 'Failed admin login attempt', { username });
  return NextResponse.json({
    success: false,
    error: 'Credenciais inválidas',
  }, { status: 401 });
}
