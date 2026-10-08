/**
 * Cache Utilities
 * 
 * Provides caching functionality for API responses.
 */

import NodeCache from 'node-cache';

// Default TTL values in seconds
export const CACHE_TTL = {
    SHORT: 60,        // 1 minute
    MEDIUM: 300,      // 5 minutes
    LONG: 3600,       // 1 hour
    DAY: 86400,       // 24 hours
    OFERTAS: 1800,    // 30 minutes
    AREAS: 3600,      // 1 hour
    NIVEIS: 3600,     // 1 hour
    RANK_CURSOS: 1800, // 30 minutes
    GRADE: 1800,      // 30 minutes
} as const;

// Global API cache instance
export const apiCache = new NodeCache({
    stdTTL: CACHE_TTL.MEDIUM,
    checkperiod: 120,
    useClones: false,
});

/**
 * Creates a standardized cache key from parameters
 */
export function createCacheKey(prefix: string, ...parts: (string | number | undefined)[]): string {
    const validParts = parts.filter(p => p !== undefined && p !== '');
    return `${prefix}:${validParts.join(':')}`;
}

/**
 * Get cached value or execute function and cache result
 */
export async function getOrCache<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = CACHE_TTL.MEDIUM
): Promise<T> {
    const cached = apiCache.get<T>(key);
    if (cached !== undefined) {
        return cached;
    }

    const result = await fn();
    apiCache.set(key, result, ttl);
    return result;
}
