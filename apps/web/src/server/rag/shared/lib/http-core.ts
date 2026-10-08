/**
 * HTTP Utilities (core)
 *
 * Helpers de HTTP framework-agnostic — usados por rotas Next e pelo legado Express.
 */

export const JSON_HEADERS = {
    'Content-Type': 'application/json',
};

/**
 * Fetch with timeout support
 */
export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeout: number = 800
): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });
        return response;
    } finally {
        clearTimeout(timeoutId);
    }
}
