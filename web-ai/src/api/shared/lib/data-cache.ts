/**
 * Data Cache Utilities
 * 
 * Provides a shared data cache for API clients.
 */

import NodeCache from 'node-cache';

// Singleton data cache instance
let dataCache: NodeCache | null = null;

/**
 * Get or create the data cache instance
 */
export function getDataCache(): NodeCache {
    if (!dataCache) {
        dataCache = new NodeCache({
            stdTTL: 600,       // 10 minutes default TTL
            checkperiod: 120,  // Check for expired keys every 2 minutes
            useClones: false,
            maxKeys: 1000,     // Limit max cached keys
        });
    }
    return dataCache;
}

/**
 * Clear all data cache entries
 */
export function clearDataCache(): void {
    if (dataCache) {
        dataCache.flushAll();
    }
}
