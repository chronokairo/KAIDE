export class AegisError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AegisError';
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

export class ValidationError extends AegisError {
  constructor(message: string, context?: Record<string, any>) {
    super('VALIDATION_ERROR', message, 400, context);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AegisError {
  constructor(message: string = 'Authentication failed', context?: Record<string, any>) {
    super('AUTHENTICATION_ERROR', message, 401, context);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AegisError {
  constructor(message: string = 'Access denied', context?: Record<string, any>) {
    super('AUTHORIZATION_ERROR', message, 403, context);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AegisError {
  constructor(resource: string, context?: Record<string, any>) {
    super('NOT_FOUND', `${resource} not found`, 404, context);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AegisError {
  constructor(message: string, context?: Record<string, any>) {
    super('CONFLICT', message, 409, context);
    this.name = 'ConflictError';
  }
}

export class TimeoutError extends AegisError {
  constructor(resource: string = 'Operation', context?: Record<string, any>) {
    super('TIMEOUT', `${resource} timed out`, 504, context);
    this.name = 'TimeoutError';
  }
}

export class ServiceUnavailableError extends AegisError {
  constructor(service: string, context?: Record<string, any>) {
    super('SERVICE_UNAVAILABLE', `${service} is unavailable`, 503, context);
    this.name = 'ServiceUnavailableError';
  }
}

export function isAegisError(error: unknown): error is AegisError {
  return error instanceof AegisError;
}

export function createErrorResponse(error: unknown) {
  if (isAegisError(error)) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      context: error.context,
    };
  }

  if (error instanceof Error) {
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message,
      },
    };
  }

  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    },
  };
}
