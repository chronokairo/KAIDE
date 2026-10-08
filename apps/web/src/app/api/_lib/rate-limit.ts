import { NextRequest, NextResponse } from 'next/server';
import { getClientIp } from './http';

/**
 * Rate limiting in-memory (porta do express-rate-limit do legado, mesmos limites e mensagens).
 */

interface RateLimitBucket {
    count: number;
    resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

function isLocalhost(ip: string): boolean {
    // 'unknown' = acesso direto sem reverse proxy (típico de dev local)
    if (ip === 'unknown') return true;
    return ip === '127.0.0.1' || ip === '::1' || ip === 'localhost' || ip.includes('127.0.0.1');
}

function consume(key: string, max: number, windowMs: number): { allowed: boolean; retryAfterSec: number } {
    const now = Date.now();
    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
        buckets.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterSec: 0 };
    }
    bucket.count += 1;
    if (bucket.count > max) {
        return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    return { allowed: true, retryAfterSec: 0 };
}

function limitResponse(message: string, retryAfterSec: number): NextResponse {
    return NextResponse.json(
        { error: message, code: 'RATE_LIMIT_EXCEEDED' },
        {
            status: 429,
            headers: { 'Retry-After': String(retryAfterSec) },
        }
    );
}

/** Limite geral: 300 req/min por IP (env RATE_LIMIT_*). */
export function generalLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIp(request);
    if (isLocalhost(ip)) return null;

    const max = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300');
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
    const { allowed, retryAfterSec } = consume(`general:${ip}`, max, windowMs);
    return allowed ? null : limitResponse('Muitas requisições. Tente novamente mais tarde.', retryAfterSec);
}

/** Limite estrito: 5 tentativas / 15 min por IP+User-Agent (env LOGIN_RATE_LIMIT_*). */
export function strictLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIp(request);
    if (isLocalhost(ip)) return null;

    const max = parseInt(process.env.LOGIN_RATE_LIMIT_MAX || '5');
    const windowMs = parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || '900000');
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const { allowed, retryAfterSec } = consume(`strict:${ip}-${userAgent.slice(0, 50)}`, max, windowMs);
    return allowed ? null : limitResponse('Muitas tentativas. Tente novamente em 15 minutos.', retryAfterSec);
}

/** Limite LGPD: 10 consultas de dados pessoais / hora por IP+Authorization. */
export function personDataLimit(request: NextRequest): NextResponse | null {
    const ip = getClientIp(request);
    if (isLocalhost(ip)) return null;

    const authorization = request.headers.get('authorization') || 'anonymous';
    const { allowed, retryAfterSec } = consume(`person:${ip}-${authorization}`, 10, 60 * 60 * 1000);
    return allowed
        ? null
        : limitResponse('Limite de consultas de dados pessoais excedido. Tente novamente em 1 hora.', retryAfterSec);
}

// Limpeza periódica de buckets expirados
const sweeper = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
        if (now > bucket.resetAt) buckets.delete(key);
    }
}, 10 * 60 * 1000);
sweeper.unref?.();
