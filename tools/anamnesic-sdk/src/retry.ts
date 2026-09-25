// ─── Retry with Exponential Backoff ───────────────────────────────────────────

import {
  APIConnectionError,
  APIConnectionTimeoutError,
  RateLimitError,
  InternalServerError,
  ChronoKairoError,
} from './errors.js';
import { isTransientError, TRANSIENT_BACKOFF_BASE_MS } from '@chronokairo/core';
import type { RetryOptions } from './types.js';

const DEFAULT_BASE_DELAY = 1000; // 1 second
const DEFAULT_MAX_DELAY = 60000; // 60 seconds

/**
 * Check if an error should be retried based on HTTP status or error type
 */
export function shouldRetryError(error: unknown, attempt: number, maxRetries: number): boolean {
  if (attempt >= maxRetries) return false

  if (error instanceof APIConnectionError) return true
  if (error instanceof APIConnectionTimeoutError) return true
  if (error instanceof RateLimitError) return true
  if (error instanceof InternalServerError) return true

  // Check if it's an HTTP error with retryable status
  if (error instanceof Error && 'status' in error) {
    const status = (error as { status?: number }).status
    // Retry on 429 (rate limit), 502 (bad gateway), 503 (service unavailable), 504 (gateway timeout)
    if (status === 429 || status === 502 || status === 503 || status === 504) {
      return true
    }
  }

  return false
}

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(attempt: number, baseDelay = DEFAULT_BASE_DELAY, maxDelay = DEFAULT_MAX_DELAY): number {
  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt)

  // Add jitter: random value between 0 and 1
  const jitter = Math.random() * exponentialDelay

  // Total delay with jitter
  const delayWithJitter = exponentialDelay + jitter

  // Cap at maxDelay
  return Math.min(delayWithJitter, maxDelay)
}

/**
 * Sleep for a given number of milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions,
): Promise<T> {
  const {
    maxRetries,
    baseDelay = DEFAULT_BASE_DELAY,
    maxDelay = DEFAULT_MAX_DELAY,
    shouldRetry: customShouldRetry,
  } = options

  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check custom shouldRetry first, then default logic
      const shouldRetryCustom = customShouldRetry?.(error, attempt) ?? shouldRetryError(error, attempt, maxRetries)

      if (!shouldRetryCustom || attempt === maxRetries) {
        throw error
      }

      const delay = calculateDelay(attempt, baseDelay, maxDelay)
      await sleep(delay)
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError
}

export async function withTransientRetry<T>(
  fn: () => Promise<T>,
  onRetry?: (attempt: number, maxRetries: number, error: Error) => void | Promise<void>,
  maxRetries = 3,
): Promise<T> {
  let attempt = 0

  while (true) {
    try {
      return await fn()
    } catch (error) {
      const normalized = error instanceof Error ? error : new Error(String(error))
      if (!isTransientError(normalized.message) || attempt >= maxRetries) {
        throw error
      }

      attempt += 1
      await onRetry?.(attempt, maxRetries, normalized)
      await sleep(TRANSIENT_BACKOFF_BASE_MS * Math.pow(2, attempt - 1))
    }
  }
}

/**
 * Decorator factory for retry logic
 */
export function retry<T extends (...args: any[]) => Promise<any>>(
  options: RetryOptions,
): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      return withRetry(() => originalMethod.apply(this, args), options)
    }
  }
}
