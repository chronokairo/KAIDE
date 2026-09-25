import { describe, it, expect } from 'vitest';
import {
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  TimeoutError,
  ServiceUnavailableError,
  isAegisError,
  createErrorResponse,
} from '@/shared/lib/errors';

describe('Error Handling', () => {
  it('should create validation error', () => {
    const error = new ValidationError('Invalid input', { field: 'email' });
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.statusCode).toBe(400);
  });

  it('should create authentication error', () => {
    const error = new AuthenticationError();
    expect(error.code).toBe('AUTHENTICATION_ERROR');
    expect(error.statusCode).toBe(401);
  });

  it('should create authorization error', () => {
    const error = new AuthorizationError();
    expect(error.code).toBe('AUTHORIZATION_ERROR');
    expect(error.statusCode).toBe(403);
  });

  it('should create not found error', () => {
    const error = new NotFoundError('User');
    expect(error.code).toBe('NOT_FOUND');
    expect(error.statusCode).toBe(404);
  });

  it('should create timeout error', () => {
    const error = new TimeoutError('Request');
    expect(error.code).toBe('TIMEOUT');
    expect(error.statusCode).toBe(504);
  });

  it('should create service unavailable error', () => {
    const error = new ServiceUnavailableError('Database');
    expect(error.code).toBe('SERVICE_UNAVAILABLE');
    expect(error.statusCode).toBe(503);
  });

  it('should detect AegisError instances', () => {
    const error = new ValidationError('Test');
    expect(isAegisError(error)).toBe(true);

    const regularError = new Error('Test');
    expect(isAegisError(regularError)).toBe(false);
  });

  it('should create error response from AegisError', () => {
    const error = new ValidationError('Invalid', { field: 'name' });
    const response = createErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('VALIDATION_ERROR');
  });

  it('should create error response from regular Error', () => {
    const error = new Error('Something went wrong');
    const response = createErrorResponse(error);

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('INTERNAL_ERROR');
  });

  it('should create error response from unknown', () => {
    const response = createErrorResponse('Unknown error');

    expect(response.success).toBe(false);
    expect(response.error?.code).toBe('UNKNOWN_ERROR');
  });
});
