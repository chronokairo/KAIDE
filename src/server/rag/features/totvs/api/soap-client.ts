/**
 * @layer features/totvs/api
 * @description Cliente SOAP para TOTVS RM
 */

import { fetchWithTimeout, JSON_HEADERS } from '../../../shared/lib/http-core.js';
import { TOTVS_BASE_URL, TOTVS_AUTH } from '../../../shared/config/environment.js';
import { logger } from '../../../shared/lib/logger.js';

// Configurações SOAP
export const SOAP_CONFIG = {
    DATA_SERVERS: {
        USUARIO: 'EduPSUsuarioData',
        PESSOA: 'EduPSPessoaData',
        INSCRICAO: 'EduPSInscricaoAreaOfertadaData'
    },
    ACTIONS: {
        READ: 'http://www.totvs.com/IwsDataServer/ReadRecord',
        SAVE: 'http://www.totvs.com/IwsDataServer/SaveRecord'
    },
    CONTEXT: {
        CODCOLIGADA: '4',
        CODFILIAL: '1',
        CODUSUARIO: 'portal',
        CODSISTEMA: 'S'
    }
};

const SOAP_ENDPOINT = '/wsDataServer/IwsDataServer';

// Helpers
const escapeXml = (str: string): string => {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
};

const cleanCPF = (cpf: string): string => {
    if (!cpf) return '';
    const cleaned = cpf.replace(/\D/g, '');
    return cleaned.length === 11 ? cleaned : '';
};

const cleanPhone = (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/\D/g, '').slice(0, 15);
};

const getContexto = (): string => {
    return Object.entries(SOAP_CONFIG.CONTEXT)
        .map(([key, value]) => `${key}=${value}`)
        .join(',');
};

// Fazer requisição SOAP
export async function makeSoapRequest(soapAction: string, soapBody: string): Promise<string> {
    const url = `${TOTVS_BASE_URL}${SOAP_ENDPOINT}`;

    logger.debug('SOAP', `Request to ${soapAction}`, { url });

    const response = await fetchWithTimeout(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': soapAction,
            'Authorization': `Basic ${TOTVS_AUTH}`
        },
        body: soapBody
    }, 800);

    if (!response.ok) {
        throw new Error(`SOAP request failed: ${response.status} ${response.statusText}`);
    }

    return response.text();
}

// Parse resposta SOAP
export function parseSoapResponse(soapResponse: string): { success: boolean; data?: any; error?: string; userId?: string } {
    // Verificar erro SOAP
    const faultMatch = soapResponse.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/);
    if (faultMatch) {
        return { success: false, error: faultMatch[1] };
    }

    // Extrair resultado SaveRecord
    const saveResultMatch = soapResponse.match(/<SaveRecordResult[^>]*>([\s\S]*?)<\/SaveRecordResult>/);
    if (saveResultMatch) {
        const result = saveResultMatch[1];
        // Extrair ID do usuário criado
        const userIdMatch = result.match(/<CODUSUARIOPS[^>]*>(\d+)<\/CODUSUARIOPS>/i);
        return {
            success: true,
            data: result,
            userId: userIdMatch ? userIdMatch[1] : undefined
        };
    }

    // Extrair resultado ReadRecord
    const readResultMatch = soapResponse.match(/<ReadRecordResult[^>]*>([\s\S]*?)<\/ReadRecordResult>/);
    if (readResultMatch) {
        return { success: true, data: readResultMatch[1] };
    }

    return { success: false, error: 'Resposta SOAP não reconhecida' };
}

// ============================================
// CONSULTAR PESSOA POR CPF
// ============================================
export async function consultarPessoaPorCPF(cpf: string): Promise<{ success: boolean; pessoa?: any; error?: string }> {
    const cpfLimpo = cleanCPF(cpf);
    if (!cpfLimpo) {
        return { success: false, error: 'CPF inválido. Deve conter exatamente 11 dígitos.' };
    }

    const contexto = getContexto();
    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <tot:ReadRecord>
         <tot:DataServerName>${SOAP_CONFIG.DATA_SERVERS.PESSOA}</tot:DataServerName>
         <tot:PrimaryKey>1</tot:PrimaryKey>
         <tot:Filter>CODCOLIGADA=4;CPF=${cpfLimpo}</tot:Filter>
         <tot:Contexto>${contexto}</tot:Contexto>
      </tot:ReadRecord>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const response = await makeSoapRequest(SOAP_CONFIG.ACTIONS.READ, soapBody);
        const parsed = parseSoapResponse(response);

        if (parsed.success && parsed.data) {
            // Extrair dados da pessoa do XML
            const codPessoaMatch = parsed.data.match(/<CODPESSOA[^>]*>(\d+)<\/CODPESSOA>/i);
            const nomeMatch = parsed.data.match(/<NOME[^>]*>([^<]+)<\/NOME>/i);
            const codUsuarioPSMatch = parsed.data.match(/<CODUSUARIOPS[^>]*>(\d+)<\/CODUSUARIOPS>/i);

            if (codPessoaMatch || codUsuarioPSMatch) {
                return {
                    success: true,
                    pessoa: {
                        CODPESSOA: codPessoaMatch ? codPessoaMatch[1] : null,
                        CODUSUARIOPS: codUsuarioPSMatch ? codUsuarioPSMatch[1] : null,
                        NOME: nomeMatch ? nomeMatch[1] : null,
                        CPF: cpfLimpo,
                        rawData: parsed.data
                    }
                };
            }
        }

        return { success: false, error: 'Pessoa não encontrada' };
    } catch (error: any) {
        logger.error('SOAP', `Erro ao consultar pessoa: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ============================================
// CADASTRAR PESSOA
// ============================================
export interface DadosPessoa {
    cpf: string;
    nome: string;
    dataNascimento: string;
    email: string;
    sexo?: string;
    telefone?: string;
    telefone2?: string;
    nit?: string;
    conjugeBrasil?: boolean;
    naturalizado?: boolean;
    fumante?: boolean;
    canhoto?: boolean;
    isFuncionario?: boolean;
}

export async function cadastrarPessoa(dados: DadosPessoa): Promise<{ success: boolean; codUsuarioPS?: string; error?: string }> {
    const cpfLimpo = cleanCPF(dados.cpf);
    if (!cpfLimpo) {
        return { success: false, error: 'CPF inválido. Deve conter exatamente 11 dígitos.' };
    }

    // Verificar se já existe
    const existente = await consultarPessoaPorCPF(cpfLimpo);
    if (existente.success && existente.pessoa?.CODUSUARIOPS) {
        return {
            success: true,
            codUsuarioPS: existente.pessoa.CODUSUARIOPS,
            error: 'Pessoa já cadastrada'
        };
    }

    const contexto = getContexto();
    const xmlData = `<EduPSUsuario><SPSUSUARIO><CODUSUARIOPS>-1</CODUSUARIOPS><NOME>${escapeXml(dados.nome)}</NOME><DTNASCIMENTO>${escapeXml(dados.dataNascimento)}T00:00:00</DTNASCIMENTO><SEXO>${dados.sexo || 'M'}</SEXO><CPF>${cpfLimpo}</CPF><TELEFONE2>${cleanPhone(dados.telefone2 || '')}</TELEFONE2><EMAIL>${escapeXml(dados.email)}</EMAIL><TELEFONE>${cleanPhone(dados.telefone || '')}</TELEFONE><NIT>${dados.nit || '0'}</NIT><CONJUGEBRASIL>${dados.conjugeBrasil ? '1' : '0'}</CONJUGEBRASIL><NATURALIZADO>${dados.naturalizado ? '1' : '0'}</NATURALIZADO><FUMANTE>${dados.fumante ? '1' : '0'}</FUMANTE><CANHOTO>${dados.canhoto ? 'T' : 'F'}</CANHOTO><ISFUNCIONARIO>${dados.isFuncionario ? 'T' : 'F'}</ISFUNCIONARIO></SPSUSUARIO></EduPSUsuario>`;

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <tot:SaveRecord>
         <tot:DataServerName>${SOAP_CONFIG.DATA_SERVERS.USUARIO}</tot:DataServerName>
         <tot:XML><![CDATA[${xmlData}]]></tot:XML>
         <tot:Contexto>${contexto}</tot:Contexto>
      </tot:SaveRecord>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const response = await makeSoapRequest(SOAP_CONFIG.ACTIONS.SAVE, soapBody);
        const parsed = parseSoapResponse(response);

        if (parsed.success) {
            // Buscar o código do usuário criado
            if (parsed.userId) {
                logger.info('SOAP', `Pessoa cadastrada com sucesso: ${parsed.userId}`);
                return { success: true, codUsuarioPS: parsed.userId };
            }

            // Tentar buscar novamente pelo CPF
            const novaBusca = await consultarPessoaPorCPF(cpfLimpo);
            if (novaBusca.success && novaBusca.pessoa?.CODUSUARIOPS) {
                return { success: true, codUsuarioPS: novaBusca.pessoa.CODUSUARIOPS };
            }

            return { success: true };
        }

        return { success: false, error: parsed.error || 'Erro ao cadastrar pessoa' };
    } catch (error: any) {
        logger.error('SOAP', `Erro ao cadastrar pessoa: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ============================================
// REALIZAR INSCRIÇÃO
// ============================================
export interface DadosInscricao {
    codUsuarioPS: string;
    nome?: string;
    selectedCourseData: {
        IDPS: string;
        IDAREAINTERESSE: string;
        IDHABILITACAOFILIAL: string;
        IDPERLET?: string;
        CODCAMPUS?: string;
        CURSO?: string;
    };
    treineiro?: boolean;
}

export async function realizarInscricao(dados: DadosInscricao): Promise<{ success: boolean; numeroInscricao?: string; error?: string }> {
    if (!dados.codUsuarioPS) {
        return { success: false, error: 'Código do usuário PS é obrigatório' };
    }

    if (!dados.selectedCourseData?.IDPS || !dados.selectedCourseData?.IDAREAINTERESSE || !dados.selectedCourseData?.IDHABILITACAOFILIAL) {
        return { success: false, error: 'Dados do curso incompletos' };
    }

    const contexto = getContexto();
    const now = new Date().toISOString();
    const course = dados.selectedCourseData;

    const xmlData = `<EduPSInscricaoAreaOfertada>
<SPSInscricaoAreaOfertada>
<CODCOLIGADA>4</CODCOLIGADA>
<IDPS>${course.IDPS}</IDPS>
<NUMEROINSCRICAO>-1</NUMEROINSCRICAO>
<IDFORMAINSCRICAO>1</IDFORMAINSCRICAO>
<DATAINSCRICAO>${now}</DATAINSCRICAO>
<VALORINSCRICAO>0</VALORINSCRICAO>
<CODMUNICIPIO>02603</CODMUNICIPIO>
<CODETDMUNICIPIO>AM</CODETDMUNICIPIO>
<STATUS>0</STATUS>
<TREINEIRO>${dados.treineiro ? 'T' : 'F'}</TREINEIRO>
<CODCOLIGADAMAT>4</CODCOLIGADAMAT>
<IDPERLET>${course.IDPERLET || '49'}</IDPERLET>
<IDHABFILIALMAT>${course.IDHABILITACAOFILIAL}</IDHABFILIALMAT>
<NOMECANDIDATO>${escapeXml(dados.nome || '')}</NOMECANDIDATO>
<IDCAMPUS>${course.CODCAMPUS || '1'}</IDCAMPUS>
<NOMEPESSOAACEITEPORTAL>${escapeXml(dados.nome || '')}</NOMEPESSOAACEITEPORTAL>
<DATAHORAACEITEPORTAL>${now}</DATAHORAACEITEPORTAL>
<CODUSUARIOPS>${dados.codUsuarioPS}</CODUSUARIOPS>
<USANOVOPORTAL>T</USANOVOPORTAL>
<CODFILIAL>1</CODFILIAL>
</SPSInscricaoAreaOfertada>
<SPSOpcaoInscrito>
<CODCOLIGADA>4</CODCOLIGADA>
<IDPS>${course.IDPS}</IDPS>
<NUMEROINSCRICAO>-1</NUMEROINSCRICAO>
<IDAREAINTERESSE>${course.IDAREAINTERESSE}</IDAREAINTERESSE>
<NUMEROOPCAO>1</NUMEROOPCAO>
<NOME>${escapeXml(course.CURSO || '')}</NOME>
<ULTIMAETAPA>1</ULTIMAETAPA>
<STATUS>0</STATUS>
<CODUSUARIOPS>${dados.codUsuarioPS}</CODUSUARIOPS>
</SPSOpcaoInscrito>
<SPSInscAreaOfertaCompl>
<CODCOLIGADA>4</CODCOLIGADA>
<IDPS>${course.IDPS}</IDPS>
<NUMEROINSCRICAO>-1</NUMEROINSCRICAO>
<SPSATEND>portal</SPSATEND>
</SPSInscAreaOfertaCompl>
<SPSAceiteTermo>
<CODACEITETERMO>1290</CODACEITETERMO>
<CODCOLIGADA>4</CODCOLIGADA>
<IDPS>${course.IDPS}</IDPS>
<IDAREAINTERESSE>${course.IDAREAINTERESSE}</IDAREAINTERESSE>
<CODUSUARIOPS>${dados.codUsuarioPS}</CODUSUARIOPS>
<TEXTOTERMO>Termo de aceite</TEXTOTERMO>
<VERSAORELATORIO>0</VERSAORELATORIO>
<DATAHORAACEITE>${now}</DATAHORAACEITE>
<TIPOCONSENTIMENTO>1</TIPOCONSENTIMENTO>
<CLIENTIP>0.0.0.0</CLIENTIP>
</SPSAceiteTermo>
</EduPSInscricaoAreaOfertada>`;

    const soapBody = `<?xml version="1.0" encoding="utf-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:tot="http://www.totvs.com/">
   <soapenv:Header/>
   <soapenv:Body>
      <tot:SaveRecord>
         <tot:DataServerName>${SOAP_CONFIG.DATA_SERVERS.INSCRICAO}</tot:DataServerName>
         <tot:XML><![CDATA[${xmlData}]]></tot:XML>
         <tot:Contexto>${contexto}</tot:Contexto>
      </tot:SaveRecord>
   </soapenv:Body>
</soapenv:Envelope>`;

    try {
        const response = await makeSoapRequest(SOAP_CONFIG.ACTIONS.SAVE, soapBody);
        const parsed = parseSoapResponse(response);

        if (parsed.success) {
            // Extrair número da inscrição
            const numInscricaoMatch = parsed.data?.match(/<NUMEROINSCRICAO[^>]*>(\d+)<\/NUMEROINSCRICAO>/i);
            const numeroInscricao = numInscricaoMatch ? numInscricaoMatch[1] : undefined;

            logger.info('SOAP', `Inscrição realizada: ${numeroInscricao || 'OK'}`);
            return { success: true, numeroInscricao };
        }

        return { success: false, error: parsed.error || 'Erro ao realizar inscrição' };
    } catch (error: any) {
        logger.error('SOAP', `Erro ao realizar inscrição: ${error.message}`);
        return { success: false, error: error.message };
    }
}

// ============================================
// BUSCAR USUÁRIO POR CPF (para login)
// ============================================
export async function buscarUsuarioPorCPF(cpf: string): Promise<{ success: boolean; codUsuarioPS?: string; codPessoa?: string; nome?: string; error?: string }> {
    const result = await consultarPessoaPorCPF(cpf);
    
    if (result.success && result.pessoa) {
        return {
            success: true,
            codUsuarioPS: result.pessoa.CODUSUARIOPS,
            codPessoa: result.pessoa.CODPESSOA,
            nome: result.pessoa.NOME
        };
    }

    return { success: false, error: result.error || 'Usuário não encontrado' };
}
