// ─── Base Error Class ──────────────────────────────────────────────────────────

export class ChronoKairoError extends Error {
  status?: number;
  headers: Record<string, string>;
  requestId: string | null;
  error?: { type?: string; message?: string };

  constructor(options: { message?: string; name?: string; status?: number; error?: { type?: string; message?: string }; headers?: Record<string, string> } = {}) {
    const message = options.message || options.error?.message || 'ChronoKairo error';
    super(message);
    this.name = options.name || 'ChronoKairoError';
    this.status = options.status;
    this.headers = options.headers ?? {};
    this.requestId = options.headers?.['x-request-id'] ?? null;
    this.error = options.error;
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ─── API Errors ──────────────────────────────────────────────────────────────

export class APIError extends ChronoKairoError {
  constructor(options: {
    status: number;
    error?: { type?: string; message?: string };
    message?: string;
    headers?: Record<string, string>;
  }) {
    super({
      name: 'APIError',
      message: options.message || options.error?.message || `API Error ${options.status}`,
      status: options.status,
      error: options.error,
      headers: options.headers,
    });
  }

  static fromResponse(response: Response, error?: { type?: string; message?: string }): APIError {
    const headers: Record<string, string> = {};
    response.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return new APIError({
      status: response.status,
      error,
      message: error?.message,
      headers,
    });
  }
}

// ─── Client Errors ───────────────────────────────────────────────────────────

export class APIUserAbortError extends APIError {
  constructor(message = 'Request aborted by user') {
    super({
      status: 0,
      error: { type: 'user_abort', message },
    });
    this.name = 'APIUserAbortError';
  }
}

export class APIConnectionError extends APIError {
  constructor(message = 'Connection error') {
    super({
      status: 500,
      error: { type: 'connection_error', message },
    });
    this.name = 'APIConnectionError';
  }
}

export class APIConnectionTimeoutError extends APIConnectionError {
  constructor(message = 'Connection timeout') {
    super(message);
    this.name = 'APIConnectionTimeoutError';
  }
}

export class AuthenticationError extends APIError {
  constructor(message = 'Authentication error') {
    super({
      status: 401,
      error: { type: 'authentication_error', message },
    });
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends APIError {
  constructor(message = 'Not found') {
    super({
      status: 404,
      error: { type: 'not_found', message },
    });
    this.name = 'NotFoundError';
  }
}

export class PermissionDeniedError extends APIError {
  constructor(message = 'Permission denied') {
    super({
      status: 403,
      error: { type: 'permission_denied', message },
    });
    this.name = 'PermissionDeniedError';
  }
}

export class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded') {
    super({
      status: 429,
      error: { type: 'rate_limit_error', message },
    });
    this.name = 'RateLimitError';
  }
}

export class InternalServerError extends APIError {
  constructor(message = 'Internal server error') {
    super({
      status: 500,
      error: { type: 'internal_server_error', message },
    });
    this.name = 'InternalServerError';
  }
}

export class BadRequestError extends APIError {
  constructor(message = 'Bad request') {
    super({
      status: 400,
      error: { type: 'bad_request', message },
    });
    this.name = 'BadRequestError';
  }
}

export class UnprocessableEntityError extends APIError {
  constructor(message = 'Unprocessable entity') {
    super({
      status: 422,
      error: { type: 'unprocessable_entity', message },
    });
    this.name = 'UnprocessableEntityError';
  }
}

// ─── Additional Chronokairo-specific Errors ───────────────────────────────────

export class OverloadedError extends APIError {
  constructor(message = 'Service overloaded') {
    super({
      status: 503,
      error: { type: 'overloaded', message },
    });
    this.name = 'OverloadedError';
  }
}

export class ContentFilterError extends APIError {
  constructor(message = 'Content blocked by filter') {
    super({
      status: 400,
      error: { type: 'content_filter_error', message },
    });
    this.name = 'ContentFilterError';
  }
}

export class ContextWindowExceededError extends APIError {
  constructor(message = 'Context window exceeded') {
    super({
      status: 400,
      error: { type: 'context_window_exceeded', message },
    });
    this.name = 'ContextWindowExceededError';
  }
}

export class ModelNotFoundError extends APIError {
  constructor(message = 'Model not found') {
    super({
      status: 404,
      error: { type: 'model_not_found', message },
    });
    this.name = 'ModelNotFoundError';
  }
}

export class InvalidRequestError extends APIError {
  constructor(message = 'Invalid request') {
    super({
      status: 400,
      error: { type: 'invalid_request_error', message },
    });
    this.name = 'InvalidRequestError';
  }
}

export class JsonSerializationError extends APIError {
  constructor(message = 'JSON serialization error') {
    super({
      status: 400,
      error: { type: 'json_serialization_error', message },
    });
    this.name = 'JsonSerializationError';
  }
}

export class LinkAuthenticationError extends APIError {
  constructor(message = 'Link authentication error') {
    super({
      status: 401,
      error: { type: 'link_authentication_error', message },
    });
    this.name = 'LinkAuthenticationError';
  }
}

// ─── Sandbox Errors ───────────────────────────────────────────────────────────

export class SandboxError extends ChronoKairoError {
  constructor(message = 'Sandbox error') {
    super({ name: 'SandboxError', message });
  }
}

export class SandboxViolationError extends SandboxError {
  constructor(public readonly violation: SandboxViolationEvent, message = 'Sandbox violation detected') {
    super(message);
    this.name = 'SandboxViolationError';
  }
}

export class SandboxInitializationError extends SandboxError {
  constructor(message = 'Sandbox initialization failed') {
    super(message);
    this.name = 'SandboxInitializationError';
  }
}

// ─── Retry Errors ─────────────────────────────────────────────────────────────

export class MaxRetriesExceededError extends ChronoKairoError {
  constructor(public readonly lastError: unknown, message = 'Max retries exceeded') {
    super({ name: 'MaxRetriesExceededError', message });
  }
}