/**
 * @layer features/auth
 * @description Rotas de autenticação
 */

import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { logger } from '../../shared/lib/logger.js';
import { timingSafeCompare } from '../../shared/lib/crypto.js';
import { validateCPF } from '../../shared/lib/validation.js';
import { getSupabase, resolveUserOrganizationId } from '../../shared/lib/supabase.js';
import {
    isProduction,
    ADMIN_USERNAME,
    ADMIN_PASSWORD,
    ATTENDANT_INITIAL_PASSWORD
} from '../../shared/config/environment.js';
import {
    generateSecureToken,
    registerToken,
    setAuthCookie,
    clearAuthCookie,
    getTokenFromRequest,
    invalidateToken,
    validateToken,
    SESSION_COOKIE_NAME
} from './session.js';
import { generateCsrfToken, validateCsrfToken } from './csrf.js';
import { requireAuth, auditLog } from './middleware.js';
import { AtendenteRepository } from '../../entities/atendente/repository.js';

export const authRouter: Router = Router();

/**
 * GET /csrf - Get a CSRF token for login forms
 */
authRouter.get('/csrf', (req: Request, res: Response) => {
    let sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    if (!sessionId) {
        sessionId = crypto.randomBytes(32).toString('hex');
        res.cookie(SESSION_COOKIE_NAME, sessionId, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'strict',
            maxAge: 60 * 60 * 1000,
            path: '/'
        });
    }

    const csrfToken = generateCsrfToken(sessionId);

    logger.info('CSRF', 'CSRF token generated for login', { ip: req.ip });
    return res.json({
        success: true,
        csrfToken
    });
});

/**
 * GET /verify - Verify if the current session is valid
 */
authRouter.get('/verify', (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Not authenticated',
            code: 'AUTH_REQUIRED'
        });
    }

    const validation = validateToken(token);

    if (!validation.valid) {
        logger.warn('AUTH', `Invalid session verification attempt: ${validation.error}`, { ip: req.ip });
        return res.status(401).json({
            success: false,
            error: 'Session invalid or expired',
            code: 'INVALID_TOKEN'
        });
    }

    logger.info('AUTH', 'Session verified', { ip: req.ip, userId: validation.userId });
    return res.json({
        success: true,
        message: 'Session valid'
    });
});

/**
 * POST /logout - Logout and clear httpOnly cookie
 */
authRouter.post('/logout', (req: Request, res: Response) => {
    const token = getTokenFromRequest(req);

    if (token) {
        invalidateToken(token);
    }

    clearAuthCookie(res);

    logger.info('AUTH', 'User logged out', { ip: req.ip });
    return res.json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * POST /admin - Admin login validation
 */
authRouter.post('/admin', (req: Request, res: Response) => {
    const { username, password, csrfToken } = req.body;
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    if (csrfToken && sessionId) {
        if (!validateCsrfToken(csrfToken, sessionId)) {
            logger.warn('CSRF', 'Invalid CSRF token on admin login', { ip: req.ip });
            return res.status(403).json({
                success: false,
                error: 'Sessão expirada. Recarregue a página.',
                code: 'CSRF_INVALID'
            });
        }
    } else if (isProduction) {
        logger.warn('CSRF', 'Missing CSRF token on admin login', { ip: req.ip });
    }

    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Credenciais inválidas'
        });
    }

    if (!ADMIN_PASSWORD) {
        logger.warn('AUTH', 'Admin login attempt but ADMIN_PASSWORD not configured');
        return res.status(503).json({
            success: false,
            error: 'Sistema de login não configurado'
        });
    }

    const usernameValid = timingSafeCompare(username, ADMIN_USERNAME);
    const passwordValid = timingSafeCompare(password, ADMIN_PASSWORD);

    if (usernameValid && passwordValid) {
        const token = generateSecureToken();
        registerToken(token, `admin:${username}`);
        setAuthCookie(res, token);
        logger.info('AUTH', 'Admin login successful', { username });
        return res.json({
            success: true,
            message: 'Login realizado com sucesso'
        });
    }

    logger.warn('AUTH', 'Failed admin login attempt', { username, ip: req.ip });
    return res.status(401).json({
        success: false,
        error: 'Credenciais inválidas'
    });
});

/**
 * POST /attendant/validate - Validate attendant initial password
 */
authRouter.post('/attendant/validate', (req: Request, res: Response) => {
    const { code, password, csrfToken } = req.body;
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];

    if (csrfToken && sessionId) {
        if (!validateCsrfToken(csrfToken, sessionId)) {
            logger.warn('CSRF', 'Invalid CSRF token on attendant validate', { ip: req.ip });
            return res.status(403).json({
                success: false,
                error: 'Sessão expirada. Recarregue a página.',
                code: 'CSRF_INVALID'
            });
        }
    } else if (isProduction) {
        logger.warn('CSRF', 'Missing CSRF token on attendant validate', { ip: req.ip });
    }

    if (!code || !password || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Dados inválidos'
        });
    }

    if (!ATTENDANT_INITIAL_PASSWORD) {
        logger.warn('AUTH', 'Attendant validation attempt but ATTENDANT_INITIAL_PASSWORD not configured');
        return res.status(503).json({
            success: false,
            error: 'Sistema de login não configurado'
        });
    }

    if (timingSafeCompare(password, ATTENDANT_INITIAL_PASSWORD)) {
        const token = generateSecureToken();
        registerToken(token, `attendant:${code}`);
        setAuthCookie(res, token);
        logger.info('AUTH', 'Attendant initial password validated', { code });
        return res.json({
            success: true,
            message: 'Senha validada com sucesso'
        });
    }

    logger.warn('AUTH', 'Failed attendant password validation', { code, ip: req.ip });
    return res.status(401).json({
        success: false,
        error: 'Senha incorreta'
    });
});

/**
 * POST /attendant/local - Local attendant authentication
 */
authRouter.post('/attendant/local', (req: Request, res: Response) => {
    const { code, password } = req.body;

    if (!code || !password || typeof code !== 'string' || typeof password !== 'string') {
        return res.status(400).json({
            success: false,
            error: 'Código e senha são obrigatórios'
        });
    }

    const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!sanitizedCode) {
        return res.status(400).json({
            success: false,
            error: 'Código do atendente inválido'
        });
    }

    try {
        if (!AtendenteRepository.hasLocalPassword(sanitizedCode)) {
            return res.status(404).json({
                success: false,
                error: 'Atendente não possui senha local configurada',
                code: 'NO_LOCAL_PASSWORD'
            });
        }

        const result = AtendenteRepository.authenticateLocal(sanitizedCode, password);

        if (result.success && result.atendente) {
            const token = generateSecureToken();
            registerToken(token, `attendant:${sanitizedCode}`);
            setAuthCookie(res, token);

            logger.info('AUTH', 'Attendant local login successful', { code: sanitizedCode });

            return res.json({
                success: true,
                atendente: {
                    codigo: result.atendente.codigo,
                    nome: result.atendente.nome,
                    permissao: result.atendente.permissao
                }
            });
        }

        logger.warn('AUTH', 'Failed local attendant login', { code: sanitizedCode, ip: req.ip });
        return res.status(401).json({
            success: false,
            error: result.error || 'Senha incorreta'
        });
    } catch (error: any) {
        logger.error('AUTH', 'Error in local attendant login', { error: error.message });
        return res.status(500).json({
            success: false,
            error: 'Erro interno ao autenticar'
        });
    }
});

/**
 * GET /attendant/check/:code - Check if attendant has local password
 */
authRouter.get('/attendant/check/:code', (req: Request, res: Response) => {
    const { code } = req.params;

    const sanitizedCode = code.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
    if (!sanitizedCode) {
        return res.status(400).json({
            success: false,
            error: 'Código inválido'
        });
    }

    const hasLocalPassword = AtendenteRepository.hasLocalPassword(sanitizedCode);

    res.json({
        success: true,
        code: sanitizedCode,
        hasLocalPassword
    });
});

/**
 * Resolve a organização ativa do chamador (via token de sessão).
 * 403 quando não há membership ativa — dados de pessoa exigem organização.
 */
async function resolveCallerOrganization(req: Request, res: Response): Promise<string | null> {
    const userId = (req as any).userId as string | undefined;
    const organizationId = await resolveUserOrganizationId(userId);
    if (!organizationId) {
        res.status(403).json({
            success: false,
            error: 'Usuário sem organização ativa',
            code: 'NO_ACTIVE_ORG'
        });
        return null;
    }
    return organizationId;
}

// Protected person data routes (Supabase prod: customers + contacts)
authRouter.get('/pessoa/cpf/:cpf', requireAuth, auditLog, async (req: Request, res: Response) => {
    const { cpf } = req.params;

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        logger.warn('API', `CPF inválido: ${cpf}`, { ip: req.ip });
        return res.status(400).json({
            success: false,
            error: 'CPF inválido',
            code: 'INVALID_CPF'
        });
    }

    const organizationId = await resolveCallerOrganization(req, res);
    if (!organizationId) return;

    try {
        const supabase = getSupabase();
        const { data: customer, error } = await supabase
            .from('customers')
            .select('id, name, nome_fantasia, documento, email, phone, tipo, status, segmento, cidade, created_at')
            .eq('organization_id', organizationId)
            .eq('documento', cpfValidation.cleaned)
            .maybeSingle();

        if (error) throw error;
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Pessoa não encontrada', code: 'NOT_FOUND' });
        }

        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, first_name, last_name, email, phone, job_title, is_primary')
            .eq('organization_id', organizationId)
            .eq('customer_id', (customer as { id: string }).id);

        res.json({ success: true, data: { ...customer, contacts: contacts || [] } });
    } catch (error: any) {
        logger.error('API', `Erro ao buscar pessoa por CPF: ${error.message}`);
        res.status(500).json({ success: false, error: 'Erro ao buscar pessoa', code: 'LOOKUP_FAILED' });
    }
});

authRouter.get('/pessoa/completa/cpf/:cpf', requireAuth, auditLog, async (req: Request, res: Response) => {
    const { cpf } = req.params;

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        logger.warn('API', `CPF inválido: ${cpf}`, { ip: req.ip });
        return res.status(400).json({
            success: false,
            error: 'CPF inválido',
            code: 'INVALID_CPF'
        });
    }

    const organizationId = await resolveCallerOrganization(req, res);
    if (!organizationId) return;

    try {
        const supabase = getSupabase();
        const { data: customer, error } = await supabase
            .from('customers')
            .select('*')
            .eq('organization_id', organizationId)
            .eq('documento', cpfValidation.cleaned)
            .maybeSingle();

        if (error) throw error;
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Pessoa não encontrada', code: 'NOT_FOUND' });
        }

        const customerId = (customer as { id: string }).id;
        const [{ data: contacts }, { data: tickets }] = await Promise.all([
            supabase
                .from('contacts')
                .select('id, first_name, last_name, email, phone, job_title, is_primary')
                .eq('organization_id', organizationId)
                .eq('customer_id', customerId),
            supabase
                .from('support_tickets')
                .select('id, code, subject, status, priority, channel, created_at, resolved_at')
                .eq('organization_id', organizationId)
                .eq('customer_id', customerId)
                .order('created_at', { ascending: false })
                .limit(20),
        ]);

        res.json({ success: true, data: { ...customer, contacts: contacts || [], tickets: tickets || [] } });
    } catch (error: any) {
        logger.error('API', `Erro ao buscar pessoa completa por CPF: ${error.message}`);
        res.status(500).json({ success: false, error: 'Erro ao buscar pessoa', code: 'LOOKUP_FAILED' });
    }
});

authRouter.get('/pessoa/:codigo', requireAuth, auditLog, async (req: Request, res: Response) => {
    const { codigo } = req.params;

    if (!codigo || typeof codigo !== 'string' || codigo.length > 64) {
        logger.warn('API', `Código de pessoa inválido: ${codigo}`, { ip: req.ip });
        return res.status(400).json({
            success: false,
            error: 'Código de pessoa inválido',
            code: 'INVALID_CODE'
        });
    }

    const organizationId = await resolveCallerOrganization(req, res);
    if (!organizationId) return;

    try {
        const supabase = getSupabase();
        const { data: customer, error } = await supabase
            .from('customers')
            .select('id, name, nome_fantasia, documento, email, phone, tipo, status, segmento, cidade, created_at')
            .eq('organization_id', organizationId)
            .eq('id', codigo)
            .maybeSingle();

        if (error) throw error;
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Pessoa não encontrada', code: 'NOT_FOUND' });
        }

        res.json({ success: true, data: customer });
    } catch (error: any) {
        logger.error('API', `Erro ao buscar pessoa por código: ${error.message}`);
        res.status(500).json({ success: false, error: 'Erro ao buscar pessoa', code: 'LOOKUP_FAILED' });
    }
});
