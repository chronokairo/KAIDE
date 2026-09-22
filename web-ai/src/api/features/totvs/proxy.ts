/**
 * @layer features/totvs
 * @description Proxy para TOTVS (REST e SOAP)
 */

import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Application } from 'express';
import { IncomingMessage, ServerResponse, ClientRequest } from 'http';
import { Socket } from 'net';
import { TOTVS_BASE_URL, TOTVS_AUTH, isProduction } from '../../shared/config/environment.js';

type ProxyReq = ClientRequest;
type ProxyRes = IncomingMessage;
type Req = IncomingMessage;
type Res = ServerResponse | Socket;

/**
 * Setup do proxy REST para TOTVS
 */
export function setupTotvsRestProxy(app: Application) {
    if (!TOTVS_AUTH && isProduction) {
        throw new Error('TOTVS credentials not configured for REST proxy');
    }

    if (!TOTVS_AUTH) {
        console.warn('⚠️ AVISO: Credenciais TOTVS não configuradas para proxy REST');
    }

    const proxyOptions: Options = {
        target: TOTVS_BASE_URL,
        changeOrigin: true,
        secure: false,
        timeout: 10000,
        pathRewrite: (path: string) => {
            if (path.startsWith('/api/wsDataServer')) {
                return path.replace(/^\/api/, '');
            }
            if (path.startsWith('/api/api/')) {
                return path.replace(/^\/api/, '');
            }
            return path;
        },
        on: {
            error: (err: Error, req: Req, res: Res) => {
                if (!isProduction) {
                    console.log('proxy error', err.message);
                }
                if (res instanceof ServerResponse && !res.headersSent) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Serviço temporariamente indisponível',
                        code: 'SERVICE_UNAVAILABLE'
                    }));
                }
            },
            proxyReq: (proxyReq: ProxyReq, req: Req, res: ServerResponse) => {
                proxyReq.setHeader('Authorization', `Basic ${TOTVS_AUTH}`);
                proxyReq.setHeader('login', '1');
                proxyReq.setTimeout(10000);
            }
        }
    } as any;

    app.use('/api', createProxyMiddleware(proxyOptions));
}

/**
 * Setup do proxy SOAP para TOTVS
 */
export function setupTotvsSoapProxy(app: Application) {
    if (!TOTVS_AUTH && isProduction) {
        throw new Error('TOTVS credentials not configured for SOAP proxy');
    }

    if (!TOTVS_AUTH) {
        console.warn('⚠️ AVISO: Credenciais TOTVS não configuradas para proxy SOAP');
    }

    const proxyOptions: Options = {
        target: TOTVS_BASE_URL,
        changeOrigin: true,
        secure: false,
        timeout: 800,
        pathRewrite: { '^/api': '' },
        on: {
            proxyReq: (proxyReq: ProxyReq, req: Req, res: ServerResponse) => {
                proxyReq.setHeader('Authorization', `Basic ${TOTVS_AUTH}`);
                if (!isProduction) {
                    console.log('📤 SOAP proxy request para:', proxyReq.path);
                }
            },
            proxyRes: (proxyRes: ProxyRes, req: Req, res: ServerResponse) => {
                if (!isProduction) {
                    console.log('📥 SOAP proxy response status:', proxyRes.statusCode);
                }
            },
            error: (err: Error, req: Req, res: Res) => {
                console.error('❌ SOAP proxy error:', err.message);
                if (res instanceof ServerResponse && !res.headersSent) {
                    res.writeHead(503, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        error: 'Serviço SOAP temporariamente indisponível',
                        code: 'SERVICE_UNAVAILABLE'
                    }));
                }
            }
        }
    } as any;

    app.use('/api/wsDataServer', createProxyMiddleware(proxyOptions));
}

/**
 * Setup de todos os proxies TOTVS
 */
export function setupTotvsProxies(app: Application) {
    setupTotvsSoapProxy(app);
    setupTotvsRestProxy(app);
}
