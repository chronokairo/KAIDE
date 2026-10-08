/**
 * @layer shared/config
 * @description Configuração de CORS
 */

import { isDevelopment } from './environment.js';

// Parse allowed origins from environment
const originsFromEnv = (process.env.ALLOWED_ORIGINS || 'https://ciesa.com.br,https://www.ciesa.com.br')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

// Add localhost for development
export const allowedOrigins = isDevelopment 
    ? [...originsFromEnv, 'http://localhost:5173', 'http://localhost:3001', 'http://localhost:80']
    : originsFromEnv;

export const corsConfig = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        if (!origin) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else if (isDevelopment) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'SOAPAction', 'X-Admin-Key', 'X-CSRF-Token']
};
