import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { generateCsrfToken } from '@/lib/csrf';
import { logger } from '@/lib/logger';
import { SESSION_COOKIE_NAME } from '@/lib/session';

export async function GET() {
  const cookieStore = await cookies();
  let sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) {
    sessionId = crypto.randomBytes(32).toString('hex');
  }

  const csrfToken = generateCsrfToken(sessionId);

  const response = NextResponse.json({
    success: true,
    csrfToken,
  });

  response.cookies.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60,
    path: '/',
  });

  logger.info('CSRF', 'CSRF token generated for login');
  return response;
}
