/**
 * @layer app
 * @description Criação e configuração do Express App
 */

import express, { Application } from 'express';
import { createServer, Server } from 'http';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import helmet from 'helmet';

import { corsConfig, allowedOrigins } from '../shared/config/cors.js';
import { helmetConfig, permissionsPolicy } from '../shared/config/security.js';
import { generalLimiter, strictLimiter, personDataLimiter } from '../shared/config/rate-limit.js';
import { generateCspNonce } from '../shared/lib/crypto.js';
import { logger } from '../shared/lib/logger.js';
import { isProduction } from '../shared/config/environment.js';

export function createApp(): { app: Application; server: Server } {
    const app = express();
    const server = createServer(app);

    // Trust proxy for Docker/reverse proxy environments
    app.set('trust proxy', 1);

    // Disable X-Powered-By header
    app.disable('x-powered-by');

    // Cookie parser
    app.use(cookieParser());

    // Generate CSP nonce for each request
    app.use((req, res, next) => {
        res.locals.cspNonce = generateCspNonce();
        next();
    });

    // Security headers with helmet
    app.use(helmet(helmetConfig as any));

    // Add Permissions-Policy header
    app.use((req, res, next) => {
        res.setHeader('Permissions-Policy', permissionsPolicy);
        next();
    });

    // Enable CORS
    app.use(cors(corsConfig as any));

    // Enable gzip compression (depois dos middlewares de segurança para não interferir com headers)
    app.use(compression({
        level: 6,
        threshold: 1024,
        filter: (req, res) => {
            if (req.headers['x-no-compression']) {
                return false;
            }
            return compression.filter(req, res);
        }
    }));

    // Block requests without Origin on sensitive API routes in production
    if (isProduction) {
        app.use('/api/auth', (req, res, next) => {
            const origin = req.headers.origin;
            if (!origin && req.headers.referer) {
                const refererOrigin = new URL(req.headers.referer).origin;
                if (!allowedOrigins.includes(refererOrigin)) {
                    logger.warn('CORS', `Blocked API request without origin from referer: ${refererOrigin}`);
                    return res.status(403).json({ error: 'Forbidden', code: 'ORIGIN_REQUIRED' });
                }
            }
            next();
        });
    }

    // Apply rate limiting
    app.use('/api', generalLimiter);
    app.use('/api/auth', strictLimiter);
    app.use('/api/totvs/pessoa', personDataLimiter);

    // Parse JSON bodies
    app.use(express.json());

    return { app, server };
}
