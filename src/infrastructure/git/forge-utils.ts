/**
 * Shared utility helpers for forge adapters.
 */

/**
 * Safely executes a promise-returning function, capturing any errors as warnings
 * without throwing, and returning the supplied fallback value.
 */
export async function safeFetch<T>(
  fn: () => Promise<T>,
  fallback: T,
  warnings: string[],
  context: string
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    warnings.push(`${context}: ${detail}`);
    return fallback;
  }
}

/**
 * Splits text into non-empty, trimmed lines.
 */
export function parseLines(raw: string): string[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

/**
 * Safely parses a JSON string, returning null if invalid or empty.
 */
export function safeJsonParse<T = unknown>(raw: string): T | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    return null;
  }
}
