import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getTokenFromRequestCookies, invalidateToken, clearAuthCookie } from '@/lib/session';
import { logger } from '@/lib/logger';

export async function POST() {
  const cookieStore = await cookies();
  const token = getTokenFromRequestCookies(cookieStore);

  if (token) {
    invalidateToken(token);
  }

  const response = NextResponse.json({
    success: true,
    message: 'Logout successful',
  });

  clearAuthCookie(response);
  logger.info('AUTH', 'User logged out');
  return response;
}
