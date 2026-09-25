export type RetryOptions = {
  attempts?: number;
  minDelayMs?: number;
  maxDelayMs?: number;
  shouldRetry?: (error: unknown) => boolean;
};

export async function retry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const minDelayMs = options.minDelayMs ?? 250;
  const maxDelayMs = options.maxDelayMs ?? 4_000;
  const shouldRetry = options.shouldRetry ?? isTransientError;
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === attempts - 1 || !shouldRetry(error)) break;
      const delay = Math.min(maxDelayMs, minDelayMs * 2 ** attempt);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

function isTransientError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /(?:timeout|timed out|ECONNRESET|ECONNREFUSED|EAI_AGAIN|429|5\d\d)/i.test(message);
}
