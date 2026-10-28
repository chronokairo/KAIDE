import { NextResponse } from 'next/server';
import pkg from '../../../../package.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/version - Versão e commit do build.
 */
export async function GET() {
    return NextResponse.json({
        name: pkg.name,
        version: pkg.version,
        commit: process.env.VERCEL_GIT_COMMIT_SHA || process.env.GIT_COMMIT_SHA || 'unknown',
        environment: process.env.NODE_ENV || 'development',
    });
}
