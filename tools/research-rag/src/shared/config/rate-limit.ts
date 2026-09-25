/**
 * @layer shared/config
 * @description Configuração de Rate Limiting
 */

import rateLimit from 'express-rate-limit';

// Helper para normalizar IPs (remove ::ffff: prefix de IPv4 mapeado)
export const ipKeyGenerator = (ip: string): string => {
    // Remove IPv4 mapped prefix
    if (ip.startsWith('::ffff:')) {
        return ip.substring(7);
    }
    return ip;
};

// Helper para verificar se é localhost
export const isLocalhost = (ip: string | undefined): boolean => {
    if (!ip) return false;
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
};

// General rate limiting for all API routes
export const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300'), // 300 requests per minute
    message: { error: 'Muitas requisições. Tente novamente mais tarde.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalhost(req.ip),
});

// Strict rate limiting for sensitive endpoints (login, auth)
export const strictLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5'),
    message: { error: 'Muitas tentativas. Tente novamente em 15 minutos.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalhost(req.ip),
    keyGenerator: (req) => {
        const ip = ipKeyGenerator(req.ip || 'unknown');
        const ua = req.headers['user-agent'] || 'unknown';
        const uaHash = ua.slice(0, 50);
        return `${ip}-${uaHash}`;
    }
});

// Very strict rate limiting for person data endpoints (LGPD sensitive)
export const personDataLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Only 10 requests per hour per IP
    message: { error: 'Limite de consultas de dados pessoais excedido. Tente novamente em 1 hora.', code: 'RATE_LIMIT_EXCEEDED' },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => isLocalhost(req.ip),
    keyGenerator: (req) => {
        return `${ipKeyGenerator(req.ip || 'unknown')}-${req.headers.authorization || 'anonymous'}`;
    }
});
