import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/shared/lib/logger';

export interface RequestContext {
  requestId: string;
  method: string;
  url: string;
  ip: string;
  userAgent?: string;
  timestamp: Date;
}

export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getClientInfo(request: NextRequest): { ip: string; userAgent: string } {
  const ip = request.headers.get('x-forwarded-for') || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  return { ip, userAgent };
}

export function createRequestContext(request: NextRequest): RequestContext {
  const { ip, userAgent } = getClientInfo(request);
  
  return {
    requestId: generateRequestId(),
    method: request.method,
    url: request.url,
    ip,
    userAgent,
    timestamp: new Date(),
  };
}

export async function withRequestLogging(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  const context = createRequestContext(request);
  const startTime = Date.now();
  
  try {
    const response = await handler(request);
    
    const duration = Date.now() - startTime;
    
    logger.info('Request completed', {
      ...context,
      status: response.status,
      duration,
    });
    
    response.headers.set('X-Request-ID', context.requestId);
    response.headers.set('X-Response-Time', String(duration));
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    
    logger.error('Request failed', error instanceof Error ? error : new Error(String(error)), {
      ...context,
      duration,
    });
    
    throw error;
  }
}

export async function withErrorHandling(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await handler(request);
  } catch (error) {
    logger.error('Unhandled error', error instanceof Error ? error : new Error(String(error)), {
      method: request.method,
      url: request.url,
    });
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An internal error occurred',
        },
      },
      { status: 500 }
    );
  }
}

export function createHTTPMiddleware(
  options: {
    logRequests?: boolean;
    addRequestId?: boolean;
    addTiming?: boolean;
    handleErrors?: boolean;
  } = {}
) {
  const {
    logRequests = true,
    addRequestId = true,
    addTiming = true,
    handleErrors = true,
  } = options;
  
  return async function httpMiddleware(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    let chain = handler;
    
    if (handleErrors) {
      chain = (req) => withErrorHandling(req, chain);
    }
    
    if (logRequests || addRequestId || addTiming) {
      const wrappedHandler = async (req: NextRequest): Promise<NextResponse> => {
        const context = createRequestContext(req);
        const startTime = Date.now();
        
        try {
          const response = await chain(req);
          
          if (addRequestId) {
            response.headers.set('X-Request-ID', context.requestId);
          }
          
          if (addTiming) {
            response.headers.set('X-Response-Time', String(Date.now() - startTime));
          }
          
          if (logRequests) {
            logger.info('HTTP Request', {
              ...context,
              status: response.status,
              duration: Date.now() - startTime,
            });
          }
          
          return response;
        } catch (error) {
          logger.error('HTTP Error', error instanceof Error ? error : new Error(String(error)), {
            ...context,
            duration: Date.now() - startTime,
          });
          
          throw error;
        }
      };
      
      chain = wrappedHandler;
    }
    
    return chain(request);
  };
}

export const httpMiddleware = createHTTPMiddleware({
  logRequests: true,
  addRequestId: true,
  addTiming: true,
  handleErrors: true,
});