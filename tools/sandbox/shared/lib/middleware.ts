import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/shared/lib/logger';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
): Promise<NextResponse> {
  return new Promise(async (resolve) => {
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    const key = ip;
    const now = Date.now();
    
    let record = rateLimitStore.get(key);
    
    if (!record || now > record.resetTime) {
      record = { count: 0, resetTime: now + config.windowMs };
      rateLimitStore.set(key, record);
    }
    
    record.count++;
    
    const remaining = config.maxRequests - record.count;
    const resetSeconds = Math.ceil((record.resetTime - now) / 1000);
    
    if (record.count > config.maxRequests) {
      logger.warn('Rate limit exceeded', { ip, count: record.count });
      
      resolve(
        NextResponse.json(
          {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': String(config.maxRequests),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetSeconds),
            },
          }
        )
      );
      return;
    }
    
    const response = await handler(request);
    
    response.headers.set('X-RateLimit-Limit', String(config.maxRequests));
    response.headers.set('X-RateLimit-Remaining', String(Math.max(0, remaining)));
    response.headers.set('X-RateLimit-Reset', String(resetSeconds));
    
    resolve(response);
  });
}

export function createRateLimitMiddleware(config: RateLimitConfig) {
  return async function rateLimitMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    return withRateLimit(request, handler, config);
  };
}

export const defaultRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100,
});

export const strictRateLimit = createRateLimitMiddleware({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
});