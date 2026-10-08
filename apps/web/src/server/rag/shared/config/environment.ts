/**
 * @layer shared/config
 * @description Configurações de ambiente
 */

export const isProduction = process.env.NODE_ENV === 'production';
export const isDevelopment = process.env.NODE_ENV !== 'production';

export const PORT = process.env.PORT || 80;

// URLs externas
export const CMS_BASE_URL = process.env.CMS_BASE_URL || 'https://ciesa-cms.6ne6ou.easypanel.host/api/v1';

// Admin
export const ADMIN_API_KEY = process.env.ADMIN_API_KEY || '';
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';

// Attendant
export const ATTENDANT_INITIAL_PASSWORD = process.env.ATTENDANT_INITIAL_PASSWORD || '';

// Encryption
export const ATENDENTES_ENCRYPTION_KEY = process.env.ATENDENTES_ENCRYPTION_KEY || 'ciesa-atendentes-secret-key-2024!';
export const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
