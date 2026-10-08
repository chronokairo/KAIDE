/**
 * Crypto Utilities
 * 
 * Provides cryptographic helper functions for security operations.
 */

import crypto from 'crypto';

/**
 * Performs a timing-safe comparison of two strings.
 * This prevents timing attacks when comparing sensitive values like tokens.
 */
export function timingSafeCompare(a: string, b: string): boolean {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);

    if (bufA.length !== bufB.length) {
        // Still perform the comparison to maintain constant time
        crypto.timingSafeEqual(bufA, bufA);
        return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Generates a cryptographically secure nonce for Content Security Policy.
 * Returns a base64-encoded random string.
 */
export function generateCspNonce(): string {
    return crypto.randomBytes(16).toString('base64');
}
