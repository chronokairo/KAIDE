/**
 * @layer features/totvs
 * @description Rotas HTTP do TOTVS
 */

import { Router, Request, Response } from 'express';
import { apiCache, CACHE_TTL, createCacheKey } from '../../shared/lib/cache.js';
import { sendCachedResponse, handleError } from '../../shared/lib/http.js';
import { validateCodeParam, sanitizeQueryParam, validateCPF } from '../../shared/lib/validation.js';
import { logger } from '../../shared/lib/logger.js';
import { totvsRestRequest } from './api/rest-client.js';
import {
    consultarPessoaPorCPF,
    cadastrarPessoa,
    realizarInscricao,
    buscarUsuarioPorCPF,
    DadosPessoa,
    DadosInscricao
} from './api/soap-client.js';

export const totvsRouter: Router = Router();

/**
 * GET /ofertas - Ofertas de cursos
 */
totvsRouter.get('/ofertas', async (req: Request, res: Response) => {
    // Aceitar parâmetros vazios para buscar todas as ofertas
    const codTipoCurso = req.query.codTipoCurso ? validateCodeParam(req.query.codTipoCurso as string) : { valid: true, value: '' };
    const codTipoHab = req.query.codTipoHabilitacao ? validateCodeParam(req.query.codTipoHabilitacao as string) : { valid: true, value: '' };
    const codTipoEnsino = req.query.codTipoEnsino ? validateCodeParam(req.query.codTipoEnsino as string) : { valid: true, value: '' };
    const curso = sanitizeQueryParam(req.query.curso as string);

    const validationErrors = [codTipoCurso, codTipoHab, codTipoEnsino]
        .filter(v => !v.valid)
        .map(v => v.error);

    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: validationErrors.join(', '),
            code: 'INVALID_PARAMS'
        });
    }

    const cacheKey = createCacheKey('totvs:ofertas', codTipoCurso.value, codTipoHab.value, curso, codTipoEnsino.value);

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const params: Record<string, string> = {
            CODTIPOCURSO: codTipoCurso.value,
            CODTIPOHABILITACAO: codTipoHab.value,
            CODCURSO: curso,
            CODTIPOENSINO: codTipoEnsino.value
        };

        const data = await totvsRestRequest('E.OFERTAS', params);
        apiCache.set(cacheKey, data, CACHE_TTL.OFERTAS);
        sendCachedResponse(res, data, { cached: false });
    } catch (error: any) {
        handleError(res, error, 'totvs/ofertas');
    }
});

/**
 * GET /areas - Áreas de ensino
 */
totvsRouter.get('/areas', async (req: Request, res: Response) => {
    const cacheKey = 'totvs:areas';

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.AREA');
        apiCache.set(cacheKey, data, CACHE_TTL.AREAS);
        sendCachedResponse(res, data, { cached: false });
    } catch (error: any) {
        handleError(res, error, 'totvs/areas');
    }
});

/**
 * GET /niveis - Níveis de ensino
 */
totvsRouter.get('/niveis', async (req: Request, res: Response) => {
    const cacheKey = 'totvs:niveis';

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.NIVEL');
        apiCache.set(cacheKey, data, CACHE_TTL.NIVEIS);
        sendCachedResponse(res, data, { cached: false });
    } catch (error: any) {
        handleError(res, error, 'totvs/niveis');
    }
});

/**
 * GET /rank-cursos - Ranking de cursos
 */
totvsRouter.get('/rank-cursos', async (req: Request, res: Response) => {
    const cacheKey = 'totvs:rank-cursos';

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.RANKCURSO');
        apiCache.set(cacheKey, data, CACHE_TTL.RANK_CURSOS);
        sendCachedResponse(res, data, { cached: false });
    } catch (error: any) {
        handleError(res, error, 'totvs/rank-cursos');
    }
});

/**
 * GET /grade-curricular - Grade curricular
 */
totvsRouter.get('/grade-curricular', async (req: Request, res: Response) => {
    const codCurso = validateCodeParam(req.query.codCurso as string);
    const codHabilitacao = validateCodeParam(req.query.codHabilitacao as string);

    const validationErrors = [codCurso, codHabilitacao]
        .filter(v => !v.valid)
        .map(v => v.error);

    if (validationErrors.length > 0) {
        return res.status(400).json({
            success: false,
            error: validationErrors.join(', '),
            code: 'INVALID_PARAMS'
        });
    }

    const cacheKey = createCacheKey('totvs:grade', codCurso.value, codHabilitacao.value);

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const params: Record<string, string> = {};
        if (codCurso.value) params.CODCURSO = codCurso.value;
        if (codHabilitacao.value) params.CODHABILITACAO = codHabilitacao.value;

        const data = await totvsRestRequest('E.GRADE', params);
        apiCache.set(cacheKey, data, CACHE_TTL.GRADE);
        sendCachedResponse(res, data, { cached: false });
    } catch (error: any) {
        handleError(res, error, 'totvs/grade-curricular');
    }
});

/**
 * GET /atendentes - Lista de atendentes
 */
totvsRouter.get('/atendentes', async (req: Request, res: Response) => {
    const cacheKey = 'totvs:atendentes';

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        const data = await totvsRestRequest('E.ATENDENTE', {}, { includeColigada: false });
        const response = {
            success: true,
            atendentes: Array.isArray(data) ? data : [],
            source: 'totvs'
        };
        apiCache.set(cacheKey, response, CACHE_TTL.OFERTAS);
        res.json(response);
    } catch (error: any) {
        if (error.message?.includes('404')) {
            logger.warn('TOTVS', 'Consulta E.ATENDENTE não encontrada no TOTVS.');
            return res.json({
                success: true,
                atendentes: [],
                message: 'Consulta SQL E.ATENDENTE não configurada no TOTVS RM',
                source: 'fallback'
            });
        }
        handleError(res, error, 'totvs/atendentes');
    }
});

/**
 * GET /atendentes/matriculas - Todas as matrículas de todos os atendentes
 * Usado para análise de turmas e estatísticas de matrículas
 */
totvsRouter.get('/atendentes/matriculas', async (req: Request, res: Response) => {
    const cacheKey = 'totvs:matriculas:all';

    const cached = apiCache.get<any>(cacheKey);
    if (cached) {
        return sendCachedResponse(res, cached, { cached: true });
    }

    try {
        // Primeiro buscar todos os atendentes
        const atendentes = await totvsRestRequest('E.ATENDENTE', {}, { includeColigada: false });
        
        if (!Array.isArray(atendentes) || atendentes.length === 0) {
            return res.json({
                success: true,
                matriculas: [],
                total: 0,
                message: 'Nenhum atendente encontrado'
            });
        }

        // Buscar histórico de cada atendente em paralelo
        const historicos = await Promise.all(
            atendentes.map(async (atendente: any) => {
                try {
                    const historico = await totvsRestRequest('E.HISTATEND', 
                        { SPSATEND: atendente.CODIGO }, 
                        { includeColigada: false }
                    );
                    return Array.isArray(historico) ? historico : [];
                } catch {
                    return [];
                }
            })
        );

        // Flatten todos os históricos
        const todasMatriculas = historicos.flat();

        const response = {
            success: true,
            matriculas: todasMatriculas,
            total: todasMatriculas.length,
            porAtendente: atendentes.map((a: any, i: number) => ({
                codigo: a.CODIGO,
                nome: a.NOME,
                qtdMatriculas: historicos[i].length
            }))
        };

        apiCache.set(cacheKey, response, CACHE_TTL.OFERTAS);
        res.json(response);
    } catch (error: any) {
        handleError(res, error, 'totvs/atendentes/matriculas');
    }
});

/**
 * GET /atendentes/:codAtendente/historico - Histórico de atendimento
 */
totvsRouter.get('/atendentes/:codAtendente/historico', async (req: Request, res: Response) => {
    const { codAtendente } = req.params;

    if (!/^[A-Z0-9]+$/i.test(codAtendente)) {
        return res.status(400).json({
            success: false,
            error: 'Código de atendente inválido',
            code: 'INVALID_CODE'
        });
    }

    const sanitizedCode = codAtendente.toUpperCase().slice(0, 20);

    try {
        const data = await totvsRestRequest('E.HISTATEND', { SPSATEND: sanitizedCode }, { includeColigada: false });
        res.json({
            success: true,
            historico: Array.isArray(data) ? data : [],
            codAtendente: sanitizedCode
        });
    } catch (error: any) {
        if (error.message?.includes('404')) {
            return res.json({
                success: true,
                historico: [],
                codAtendente: sanitizedCode,
                message: 'Consulta SQL E.HISTATEND não configurada no TOTVS RM'
            });
        }
        handleError(res, error, `totvs/atendentes/${sanitizedCode}/historico`);
    }
});

// ============================================
// ROTAS SOAP - Pessoa e Inscrição
// ============================================

/**
 * GET /pessoa/cpf/:cpf - Consultar pessoa por CPF (SOAP)
 */
totvsRouter.get('/pessoa/cpf/:cpf', async (req: Request, res: Response) => {
    const { cpf } = req.params;

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        return res.status(400).json({
            success: false,
            error: 'CPF inválido',
            code: 'INVALID_CPF'
        });
    }

    try {
        const result = await consultarPessoaPorCPF(cpfValidation.cleaned);

        if (result.success && result.pessoa) {
            // Retornar no formato esperado pelo cliente (array)
            res.json([{
                CODUSUARIOPS: result.pessoa.CODUSUARIOPS,
                CODUSUARIO_PS: result.pessoa.CODUSUARIOPS,
                codUsuarioPS: result.pessoa.CODUSUARIOPS,
                CODPESSOA: result.pessoa.CODPESSOA,
                CODIGO: result.pessoa.CODPESSOA,
                NOME: result.pessoa.NOME,
                CPF: result.pessoa.CPF
            }]);
        } else {
            res.json([]);
        }
    } catch (error: any) {
        handleError(res, error, `totvs/pessoa/cpf/${cpfValidation.cleaned}`);
    }
});

/**
 * POST /pessoa/cadastrar - Cadastrar pessoa (SOAP)
 */
totvsRouter.post('/pessoa/cadastrar', async (req: Request, res: Response) => {
    const dados: DadosPessoa = req.body;

    // Validações básicas
    if (!dados.cpf || !dados.nome || !dados.email) {
        return res.status(400).json({
            success: false,
            error: 'CPF, nome e email são obrigatórios',
            code: 'INVALID_DATA'
        });
    }

    const cpfValidation = validateCPF(dados.cpf);
    if (!cpfValidation.valid) {
        return res.status(400).json({
            success: false,
            error: 'CPF inválido',
            code: 'INVALID_CPF'
        });
    }

    // Validar email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
        return res.status(400).json({
            success: false,
            error: 'Email inválido',
            code: 'INVALID_EMAIL'
        });
    }

    try {
        const result = await cadastrarPessoa({
            ...dados,
            cpf: cpfValidation.cleaned
        });

        if (result.success) {
            logger.info('TOTVS', `Pessoa cadastrada: CPF ${cpfValidation.cleaned.slice(0, 3)}***`);
            res.json({
                success: true,
                codUsuarioPS: result.codUsuarioPS,
                message: result.error || 'Cadastro realizado com sucesso'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Erro ao cadastrar pessoa'
            });
        }
    } catch (error: any) {
        handleError(res, error, 'totvs/pessoa/cadastrar');
    }
});

/**
 * POST /inscricao - Realizar inscrição (SOAP)
 */
totvsRouter.post('/inscricao', async (req: Request, res: Response) => {
    const dados: DadosInscricao = req.body;

    // Validações
    if (!dados.codUsuarioPS) {
        return res.status(400).json({
            success: false,
            error: 'Código do usuário PS é obrigatório',
            code: 'MISSING_USER'
        });
    }

    if (!dados.selectedCourseData?.IDPS || !dados.selectedCourseData?.IDAREAINTERESSE || !dados.selectedCourseData?.IDHABILITACAOFILIAL) {
        return res.status(400).json({
            success: false,
            error: 'Dados do curso incompletos (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL)',
            code: 'INVALID_COURSE_DATA'
        });
    }

    try {
        const result = await realizarInscricao(dados);

        if (result.success) {
            logger.info('TOTVS', `Inscrição realizada: ${result.numeroInscricao || 'OK'}`);
            res.json({
                success: true,
                numeroInscricao: result.numeroInscricao,
                message: 'Inscrição realizada com sucesso'
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error || 'Erro ao realizar inscrição'
            });
        }
    } catch (error: any) {
        handleError(res, error, 'totvs/inscricao');
    }
});

/**
 * POST /usuario/buscar - Buscar usuário por CPF para login (SOAP)
 */
totvsRouter.post('/usuario/buscar', async (req: Request, res: Response) => {
    const { cpf } = req.body;

    if (!cpf) {
        return res.status(400).json({
            success: false,
            error: 'CPF é obrigatório'
        });
    }

    const cpfValidation = validateCPF(cpf);
    if (!cpfValidation.valid) {
        return res.status(400).json({
            success: false,
            error: 'CPF inválido'
        });
    }

    try {
        const result = await buscarUsuarioPorCPF(cpfValidation.cleaned);

        if (result.success) {
            res.json({
                success: true,
                codusuariops: result.codUsuarioPS,
                codPessoa: result.codPessoa,
                nome: result.nome
            });
        } else {
            res.status(404).json({
                success: false,
                error: result.error || 'Usuário não encontrado'
            });
        }
    } catch (error: any) {
        handleError(res, error, 'totvs/usuario/buscar');
    }
});

// Nota: Rotas de pessoa protegidas (com auth) estão em features/auth
