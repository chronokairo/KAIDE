/**
 * Cliente SOAP TOTVS RM — copiado/adaptado de /home/luan/GitHub/site
 * (src/lib/api/totvs/soap-client.ts).
 *
 * Operacoes: consultar pessoa por CPF, cadastrar pessoa, realizar inscricao.
 */

import {
  fetchWithTimeout,
  getContexto,
  SOAP_CONFIG,
  SOAP_ENDPOINT,
  TOTVS_AUTH,
  TOTVS_BASE_URL,
} from './config';

/* ── helpers ───────────────────────────────────────────────────────── */

const escapeXml = (str: string): string => {
  if (!str) return '';
  return str
    .toString()
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

const mapModalidadeToLocalaula = (modalidade: string | undefined): string => {
  if (!modalidade) return '01'; // PRESENCIAL
  const upper = modalidade.toUpperCase().trim();
  if (upper.includes('EVP') || upper.includes('EAD')) return '02';
  return '01';
};

export async function makeSoapRequest(soapAction: string, soapBody: string): Promise<string> {
  const url = `${TOTVS_BASE_URL}${SOAP_ENDPOINT}`;

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      SOAPAction: soapAction,
      Authorization: `Basic ${TOTVS_AUTH}`,
    },
    body: soapBody,
  });

  if (!response.ok) {
    throw new Error(`SOAP request failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
}

/* TOTVS retorna XML codificado dentro de XML */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#xD;\n?/g, '')
    .replace(/&#xA;/g, '');
}

export function parseSoapResponse(soapResponse: string): {
  success: boolean;
  data?: string;
  error?: string;
  userId?: string;
} {
  const faultMatch = soapResponse.match(/<faultstring[^>]*>([\s\S]*?)<\/faultstring>/);
  if (faultMatch) {
    return { success: false, error: decodeXmlEntities(faultMatch[1]) };
  }

  const saveResultMatch = soapResponse.match(/<SaveRecordResult[^>]*>([\s\S]*?)<\/SaveRecordResult>/);
  if (saveResultMatch) {
    const result = decodeXmlEntities(saveResultMatch[1].trim());

    if (result.includes('*** ERRO ***') || result.includes('*** ERROR ***')) {
      const errorMsg = result.replace(/\*\*\* ERRO \*\*\*/g, '').replace(/\*\*\* ERROR \*\*\*/g, '').trim();
      return { success: false, error: errorMsg };
    }

    let userId: string | undefined;
    if (/^\d+$/.test(result)) {
      userId = result;
    } else {
      const userIdMatch = result.match(/<CODUSUARIOPS[^>]*>(\d+)<\/CODUSUARIOPS>/i);
      userId = userIdMatch ? userIdMatch[1] : undefined;
    }

    return { success: true, data: result, userId };
  }

  const readResultMatch = soapResponse.match(/<ReadRecordResult[^>]*>([\s\S]*?)<\/ReadRecordResult>/);
  if (readResultMatch) {
    return { success: true, data: decodeXmlEntities(readResultMatch[1]) };
  }

  return { success: false, error: 'Resposta SOAP nao reconhecida' };
}

/* ── consultar pessoa por CPF ──────────────────────────────────────── */

export interface PessoaTotvs {
  CODPESSOA: string | null;
  CODUSUARIOPS: string | null;
  NOME: string | null;
  CPF: string;
}

export async function consultarPessoaPorCPF(
  cpf: string,
): Promise<{ success: boolean; pessoa?: PessoaTotvs; error?: string }> {
  const cpfLimpo = cleanCPF(cpf);
  if (!cpfLimpo) {
    return { success: false, error: 'CPF invalido. Deve conter exatamente 11 digitos.' };
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
      // O TOTVS pode ignorar o Filter e devolver outro registro:
      // valida que o CPF retornado e o mesmo consultado.
      const cpfRetornadoMatch = parsed.data.match(/<CPF[^>]*>([^<]*)<\/CPF>/i);
      const cpfRetornado = cpfRetornadoMatch ? cpfRetornadoMatch[1].replace(/\D/g, '') : '';
      if (cpfRetornado !== cpfLimpo) {
        return { success: false, error: 'Pessoa nao encontrada' };
      }

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
          },
        };
      }
    }

    return { success: false, error: 'Pessoa nao encontrada' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/* ── cadastrar pessoa ──────────────────────────────────────────────── */

export interface DadosPessoa {
  cpf: string;
  nome: string;
  dataNascimento: string; // YYYY-MM-DD
  email: string;
  sexo?: string;
  telefone?: string;
  telefone2?: string;
  endereco?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  isCursoLivre?: boolean;
}

export async function cadastrarPessoa(
  dados: DadosPessoa,
): Promise<{ success: boolean; codUsuarioPS?: string; error?: string }> {
  const cpfLimpo = cleanCPF(dados.cpf);
  if (!cpfLimpo) {
    return { success: false, error: 'CPF invalido. Deve conter exatamente 11 digitos.' };
  }

  // Verificar se ja existe
  const existente = await consultarPessoaPorCPF(cpfLimpo);
  if (existente.success && existente.pessoa?.CODUSUARIOPS) {
    return {
      success: true,
      codUsuarioPS: existente.pessoa.CODUSUARIOPS,
      error: 'Pessoa ja cadastrada',
    };
  }

  const contexto = getContexto();

  // Curso Livre usa endereco padrao da instituicao
  const enderecoXml = dados.isCursoLivre
    ? `<RUA>JOAQUIM NABUCO</RUA><NUMERO>227</NUMERO><BAIRRO>CENTRO</BAIRRO><CIDADE>MANAUS</CIDADE><ESTADO>AM</ESTADO><CEP>69020030</CEP>`
    : `<RUA>${escapeXml(dados.endereco || '')}</RUA><NUMERO>${escapeXml(dados.numero || 'S/N')}</NUMERO><BAIRRO>${escapeXml(dados.bairro || '')}</BAIRRO><CIDADE>${escapeXml(dados.cidade || 'MANAUS')}</CIDADE><ESTADO>${escapeXml(dados.estado || 'AM')}</ESTADO><CEP>${(dados.cep || '').replace(/\D/g, '')}</CEP>`;

  const xmlData = `<EduPSUsuario><SPSUSUARIO><CODUSUARIOPS>-1</CODUSUARIOPS><NOME>${escapeXml(dados.nome)}</NOME><DTNASCIMENTO>${escapeXml(dados.dataNascimento)}T00:00:00</DTNASCIMENTO><SEXO>${dados.sexo || 'M'}</SEXO><CPF>${cpfLimpo}</CPF><TELEFONE2>${cleanPhone(dados.telefone2 || '')}</TELEFONE2><EMAIL>${escapeXml(dados.email)}</EMAIL><TELEFONE>${cleanPhone(dados.telefone || dados.telefone2 || '')}</TELEFONE><NIT>0</NIT><CONJUGEBRASIL>0</CONJUGEBRASIL><NATURALIZADO>0</NATURALIZADO><FUMANTE>0</FUMANTE><CANHOTO>F</CANHOTO><ISFUNCIONARIO>F</ISFUNCIONARIO><NACIONALIDADE>10</NACIONALIDADE><NATURALIDADE>MANAUS</NATURALIDADE>${enderecoXml}<CODTIPORUA>6</CODTIPORUA><CODTIPOBAIRRO>1</CODTIPOBAIRRO><IDPAIS>1</IDPAIS><ESTADONATAL>AM</ESTADONATAL><CODMUNICIPIO>02603</CODMUNICIPIO><CODNATURALIDADE>1302603</CODNATURALIDADE></SPSUSUARIO></EduPSUsuario>`;

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
      if (parsed.userId) {
        return { success: true, codUsuarioPS: parsed.userId };
      }

      const novaBusca = await consultarPessoaPorCPF(cpfLimpo);
      if (novaBusca.success && novaBusca.pessoa?.CODUSUARIOPS) {
        return { success: true, codUsuarioPS: novaBusca.pessoa.CODUSUARIOPS };
      }

      return { success: true };
    }

    return { success: false, error: parsed.error || 'Erro ao cadastrar pessoa' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/* ── realizar inscricao ────────────────────────────────────────────── */

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
    NOMETIPOENSINO?: string;
  };
  treineiro?: boolean;
  isCursoLivre?: boolean;
}

export async function realizarInscricao(
  dados: DadosInscricao,
): Promise<{ success: boolean; numeroInscricao?: string; error?: string }> {
  if (!dados.codUsuarioPS) {
    return { success: false, error: 'Codigo do usuario PS e obrigatorio' };
  }

  const course = dados.selectedCourseData;
  if (!course?.IDPS || !course?.IDAREAINTERESSE || !course?.IDHABILITACAOFILIAL) {
    return { success: false, error: 'Dados do curso incompletos (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL)' };
  }

  const contexto = getContexto();
  const now = new Date().toISOString();
  const localaula = mapModalidadeToLocalaula(course.NOMETIPOENSINO);

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
<OFERTAONLINE>${dados.isCursoLivre ? 'T' : 'F'}</OFERTAONLINE>
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
<LOCALAULA>${localaula}</LOCALAULA>
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
      // Formato pode ser XML com <NUMEROINSCRICAO> ou "CODCOLIGADA;IDPS;NUMEROINSCRICAO"
      let numeroInscricao: string | undefined;
      const numInscricaoMatch = parsed.data?.match(/<NUMEROINSCRICAO[^>]*>(\d+)<\/NUMEROINSCRICAO>/i);
      if (numInscricaoMatch) {
        numeroInscricao = numInscricaoMatch[1];
      } else if (typeof parsed.data === 'string' && /^\d+;\d+;\d+$/.test(parsed.data.trim())) {
        numeroInscricao = parsed.data.trim().split(';')[2];
      }

      return { success: true, numeroInscricao };
    }

    return { success: false, error: parsed.error || 'Erro ao realizar inscricao' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}
