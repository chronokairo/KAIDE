import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTokenFromRequestCookies, validateToken } from '@/lib/session';
import { logger } from '@/lib/logger';

export async function GET() {
  const cookieStore = await cookies();
  const token = getTokenFromRequestCookies(cookieStore);

  if (!token) {
    return NextResponse.json({
      success: false,
      error: 'Not authenticated',
      code: 'AUTH_REQUIRED',
    }, { status: 401 });
  }

  const validation = validateToken(token);

  if (!validation.valid) {
    logger.warn('AUTH', `Invalid session verification attempt: ${validation.error}`);
    return NextResponse.json({
      success: false,
      error: 'Session invalid or expired',
      code: 'INVALID_TOKEN',
    }, { status: 401 });
  }

  logger.info('AUTH', 'Session verified', { ip: 'server', userId: validation.userId });
  return NextResponse.json({
    success: true,
    message: 'Session valid',
  });
}
