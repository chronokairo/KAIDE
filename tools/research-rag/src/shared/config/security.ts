/**
 * @layer shared/config
 * @description Configuração de segurança (Helmet, CSP)
 */

import { isProduction } from './environment.js';
import { allowedOrigins } from './cors.js';

export const helmetConfig = {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: [
                "'self'",
                "'unsafe-inline'",
                (req: any, res: any) => `'nonce-${res.locals?.cspNonce || ''}'`,
                "https://vlibras.gov.br",
                "https://www.youtube.com",
                "https://*.gstatic.com",
                "https://cdn.jsdelivr.net"
            ],
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "data:"],
            fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
            imgSrc: ["'self'", "data:", "https:", "blob:"],
            connectSrc: [
                "'self'",
                "https://ciesa-cms.6ne6ou.easypanel.host",
                "http://ws.seculomanaus.com.br:8051",
                "https://servicodados.ibge.gov.br",
                ...(isProduction ? [] : ["webpack://*", "ws://localhost:*", "http://localhost:*"])
            ],
            frameSrc: [
                "'self'",
                "https://www.youtube.com",
                "https://vlibras.gov.br"
            ],
            frameAncestors: ["'self'", ...allowedOrigins],
            objectSrc: ["'none'"],
            baseUri: ["'self'"],
            formAction: ["'self'"],
            upgradeInsecureRequests: isProduction ? [] : null,
            ...(isProduction && { reportUri: ['/api/csp-report'] }),
        },
        reportOnly: false,
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    // Permite que assets sejam carregados corretamente em produção
    crossOriginResourcePolicy: { policy: "same-origin" as const },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" as const },
    hsts: isProduction ? { maxAge: 31536000, includeSubDomains: true } : false,
};

export const permissionsPolicy = 'geolocation=(), camera=(), microphone=(), payment=(), usb=()';

export const compressionConfig = {
    level: 6,
    threshold: 1024,
    filter: (req: any, res: any) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        // Use default filter
        return true;
    }
};
