import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/shared/lib/session';
import { logger } from '@/shared/lib/logger';

export interface LoginRequest {
  userId?: string;
  apiKey?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();
    const { userId, apiKey } = body;

    // For MVP, use a simple API key or default user
    const validApiKey = process.env.API_KEY || 'aegis-dev-key';
    const defaultUserId = 'local-user';

    // Simple validation - in production, use proper auth
    const authenticatedUserId = userId || defaultUserId;

    if (apiKey && apiKey !== validApiKey && process.env.API_KEY_REQUIRED === 'true') {
      logger.warn('Invalid API key provided');
      
      return NextResponse.json(
        {
          success: false,
          error: { code: 'INVALID_API_KEY', message: 'Invalid API key' },
        },
        { status: 401 }
      );
    }

    // Get client info for session metadata
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Create session
    const session = sessionManager.createSession(authenticatedUserId, {
      ipAddress,
      userAgent,
    });

    logger.info('Session created', { userId: authenticatedUserId, sessionId: session.id });

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Login failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        success: false,
        error: { code: 'LOGIN_FAILED', message: 'Failed to create session' },
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_SESSION', message: 'Session ID required' },
        },
        { status: 400 }
      );
    }

    const deleted = sessionManager.deleteSession(sessionId);

    if (deleted) {
      logger.info('Session deleted', { sessionId });
    }

    return NextResponse.json({
      success: deleted,
    });
  } catch (error) {
    logger.error('Logout failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        success: false,
        error: { code: 'LOGOUT_FAILED', message: 'Failed to delete session' },
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id');

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'NO_SESSION', message: 'Session ID required' },
        },
        { status: 400 }
      );
    }

    const session = sessionManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: { code: 'SESSION_EXPIRED', message: 'Session not found or expired' },
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        userId: session.userId,
        lastActivity: session.lastActivity.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
      },
    });
  } catch (error) {
    logger.error('Session check failed', error instanceof Error ? error : new Error(String(error)));

    return NextResponse.json(
      {
        success: false,
        error: { code: 'SESSION_CHECK_FAILED', message: 'Failed to check session' },
      },
      { status: 500 }
    );
  }
}