/**
 * Tools de function calling da Anna para o fluxo de matricula.
 *
 * Definicoes no formato OpenAI e executor server-side.
 * As chamadas TOTVS (REST/SOAP) ficam neste modulo.
 */

import { normalize } from '../../shared';
import {
  validateBirthDate,
  validateCPF,
  validateEmail,
  validatePhone,
} from './validation';
import { buscarOfertas, type OfertaTotvs } from './rest-client';
import {
  cadastrarPessoa,
  consultarPessoaPorCPF,
  realizarInscricao,
} from './soap-client';

/* ── Definicoes (formato OpenAI function-calling) ──────────────────── */

export const MATRICULA_TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'consultar_cursos',
      description:
        'Consulta os cursos ofertados pelo CIESA no sistema academico (TOTVS). ' +
        'Use SEMPRE que o usuario perguntar sobre cursos disponiveis, turnos, modalidades, ' +
        'valores de mensalidade ou quando precisar dos codigos da oferta. ' +
        'IMPORTANTE: O parametro "curso" deve ser o nome de um curso especifico (ex: "Direito", "Ciencia da Computacao"). ' +
        'NAO use nomes de categorias (ex: "tecnologia", "saude") neste parametro, pois a busca e por nome exato ou parcial do curso.',
      parameters: {
        type: 'object',
        properties: {
          curso: {
            type: 'string',
            description: 'Nome (ou parte do nome) do curso desejado, ex: "Direito", "Administracao".',
          },
          turno: {
            type: 'string',
            description: 'Turno desejado: "Matutino", "Vespertino" ou "Noturno". Opcional.',
          },
          modalidade: {
            type: 'string',
            description: 'Modalidade: "PRESENCIAL" ou "EAD". Opcional.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'buscar_candidato_por_cpf',
      description:
        'Busca um candidato ja cadastrado no sistema academico (TOTVS) pelo CPF. ' +
        'Use antes de cadastrar para verificar se a pessoa ja existe e obter o codigo ' +
        'de usuario (codUsuarioPS) necessario para a inscricao.',
      parameters: {
        type: 'object',
        properties: {
          cpf: {
            type: 'string',
            description: 'CPF do candidato (11 digitos, com ou sem pontuacao).',
          },
        },
        required: ['cpf'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'cadastrar_candidato',
      description:
        'Cadastra um novo candidato no sistema academico (TOTVS) e retorna o codigo de ' +
        'usuario (codUsuarioPS). Se o CPF ja estiver cadastrado, retorna o codigo existente. ' +
        'Colete e confirme com o usuario: nome completo, CPF, data de nascimento, e-mail e ' +
        'telefone ANTES de chamar esta ferramenta.',
      parameters: {
        type: 'object',
        properties: {
          nome: { type: 'string', description: 'Nome completo do candidato.' },
          cpf: { type: 'string', description: 'CPF do candidato (11 digitos).' },
          dataNascimento: {
            type: 'string',
            description: 'Data de nascimento no formato YYYY-MM-DD ou DD/MM/YYYY.',
          },
          email: { type: 'string', description: 'E-mail do candidato.' },
          telefone: { type: 'string', description: 'Telefone com DDD.' },
          sexo: { type: 'string', description: 'Sexo: "M" ou "F". Opcional.' },
          endereco: { type: 'string', description: 'Rua/logradouro. Opcional.' },
          numero: { type: 'string', description: 'Numero do endereco. Opcional.' },
          bairro: { type: 'string', description: 'Bairro. Opcional.' },
          cidade: { type: 'string', description: 'Cidade. Opcional (padrao Manaus).' },
          estado: { type: 'string', description: 'UF. Opcional (padrao AM).' },
          cep: { type: 'string', description: 'CEP. Opcional.' },
        },
        required: ['nome', 'cpf', 'dataNascimento', 'email', 'telefone'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'realizar_inscricao',
      description:
        'Realiza a inscricao do candidato em um curso no sistema academico (TOTVS). ' +
        'Requer o codUsuarioPS (obtido via buscar_candidato_por_cpf ou cadastrar_candidato) ' +
        'e os codigos da oferta (IDPS, IDAREAINTERESSE, IDHABILITACAOFILIAL, obtidos via ' +
        'consultar_cursos). SOMENTE chame apos o usuario confirmar explicitamente o curso, ' +
        'turno e os dados pessoais.',
      parameters: {
        type: 'object',
        properties: {
          codUsuarioPS: { type: 'string', description: 'Codigo do usuario no processo seletivo.' },
          nomeCandidato: { type: 'string', description: 'Nome completo do candidato.' },
          idps: { type: 'string', description: 'IDPS da oferta (de consultar_cursos).' },
          idAreaInteresse: { type: 'string', description: 'IDAREAINTERESSE da oferta.' },
          idHabilitacaoFilial: { type: 'string', description: 'IDHABILITACAOFILIAL da oferta.' },
          idPerLet: { type: 'string', description: 'IDPERLET da oferta. Opcional.' },
          codCampus: { type: 'string', description: 'CODCAMPUS da oferta. Opcional.' },
          curso: { type: 'string', description: 'Nome do curso.' },
          modalidade: { type: 'string', description: 'Modalidade da oferta (PRESENCIAL/EAD). Opcional.' },
        },
        required: ['codUsuarioPS', 'nomeCandidato', 'idps', 'idAreaInteresse', 'idHabilitacaoFilial', 'curso'],
      },
    },
  },
] as const;

/* ── Executor ──────────────────────────────────────────────────────── */

/**
 * Trava de seguranca (modo de teste): as operacoes de ESCRITA no TOTVS
 * ficam restritas enquanto a Anna estiver em validacao.
 * - cadastrar_candidato: somente com o nome "AnnaAI Teste";
 * - realizar_inscricao: somente em cursos executivos (EVP / cursos livres,
 *   processo "Processo venda de Curso - CURSOS LIVRES" no TOTVS).
 */
const TESTE_NOME_PERMITIDO = 'annaai teste';
const TESTE_PROCESSO_PERMITIDO = 'cursos livres';

/** Verifica se a oferta (pelos codigos) pertence ao processo de cursos livres. */
async function isOfertaCursoLivre(
  idps: string,
  idAreaInteresse: string,
  idHabilitacaoFilial: string,
): Promise<boolean> {
  const ofertas = await buscarOfertas();
  return ofertas.some(
    (o) =>
      String(o.IDPS) === idps &&
      String(o.IDAREAINTERESSE) === idAreaInteresse &&
      String(o.IDHABILITACAOFILIAL) === idHabilitacaoFilial &&
      normalize(String(o.NOMEPROCESSO || '')).includes(TESTE_PROCESSO_PERMITIDO),
  );
}

const MAX_OFERTAS = 12;

function formatOferta(o: OfertaTotvs) {
  return {
    curso: o.CURSO || o.NOMECURSO || '',
    turno: o.TURNO || '',
    modalidade: o.NOMETIPOENSINO || '',
    campus: o.CAMPUS_NOME || '',
    processo: o.NOMEPROCESSO || '',
    formaIngresso: o.NOMEPORTALINSCRICOES || '',
    valorMensal: o.VAL_MENSAL_CURSO ?? null,
    percBolsa: o.PERC_BOLSA ?? 0,
    vagas: o.NUMEROVAGAS ?? null,
    // Codigos necessarios para realizar_inscricao:
    IDPS: String(o.IDPS ?? ''),
    IDAREAINTERESSE: String(o.IDAREAINTERESSE ?? ''),
    IDHABILITACAOFILIAL: String(o.IDHABILITACAOFILIAL ?? ''),
    IDPERLET: o.IDPERLET != null ? String(o.IDPERLET) : '',
    CODCAMPUS: o.CODCAMPUS != null ? String(o.CODCAMPUS) : '',
  };
}

async function execConsultarCursos(args: Record<string, unknown>): Promise<string> {
  const ofertas = await buscarOfertas();

  if (!ofertas.length) {
    return JSON.stringify({ ofertas: [], aviso: 'Nenhuma oferta encontrada no sistema academico.' });
  }

  const cursoFiltro = typeof args.curso === 'string' ? normalize(args.curso) : '';
  const turnoFiltro = typeof args.turno === 'string' ? normalize(args.turno) : '';
  const modalidadeFiltro = typeof args.modalidade === 'string' ? normalize(args.modalidade) : '';

  let filtradas = ofertas;
  if (cursoFiltro) {
    filtradas = filtradas.filter((o) => normalize(String(o.CURSO || o.NOMECURSO || '')).includes(cursoFiltro));
  }
  if (turnoFiltro) {
    filtradas = filtradas.filter((o) => normalize(String(o.TURNO || '')).includes(turnoFiltro));
  }
  if (modalidadeFiltro) {
    filtradas = filtradas.filter((o) => normalize(String(o.NOMETIPOENSINO || '')).includes(modalidadeFiltro));
  }

  // Deduplicar por curso + turno + campus + modalidade
  const seen = new Set<string>();
  const unicas: OfertaTotvs[] = [];
  for (const o of filtradas) {
    const key = `${o.CURSO || o.NOMECURSO}|${o.TURNO}|${o.CAMPUS_NOME}|${o.NOMETIPOENSINO}`;
    if (!seen.has(key)) {
      seen.add(key);
      unicas.push(o);
    }
  }

  const total = unicas.length;
  const resultado = unicas.slice(0, MAX_OFERTAS).map(formatOferta);

  return JSON.stringify({
    total,
    exibindo: resultado.length,
    ofertas: resultado,
    ...(total > MAX_OFERTAS
      ? { aviso: 'Ha mais ofertas. Peca ao usuario para refinar por curso, turno ou modalidade.' }
      : {}),
  });
}

async function execBuscarCandidato(args: Record<string, unknown>): Promise<string> {
  const cpf = String(args.cpf ?? '');
  const cpfError = validateCPF(cpf);
  if (cpfError) {
    return JSON.stringify({ success: false, error: cpfError });
  }

  const result = await consultarPessoaPorCPF(cpf);
  if (result.success && result.pessoa) {
    return JSON.stringify({
      success: true,
      encontrado: true,
      codUsuarioPS: result.pessoa.CODUSUARIOPS,
      nome: result.pessoa.NOME,
    });
  }

  return JSON.stringify({
    success: true,
    encontrado: false,
    info: 'Candidato nao encontrado. Use cadastrar_candidato para criar o cadastro.',
  });
}

async function execCadastrarCandidato(args: Record<string, unknown>): Promise<string> {
  const nome = String(args.nome ?? '').trim();
  const cpf = String(args.cpf ?? '');
  const dataNascimento = String(args.dataNascimento ?? '');
  const email = String(args.email ?? '');
  const telefone = String(args.telefone ?? '');

  const erros: string[] = [];
  if (nome.split(/\s+/).length < 2) erros.push('Informe o nome completo (nome e sobrenome).');
  const cpfError = validateCPF(cpf);
  if (cpfError) erros.push(cpfError);
  const birthError = validateBirthDate(dataNascimento);
  if (birthError) erros.push(birthError);
  const emailError = validateEmail(email);
  if (emailError) erros.push(emailError);
  const phoneError = validatePhone(telefone);
  if (phoneError) erros.push(phoneError);

  if (erros.length) {
    return JSON.stringify({ success: false, errosValidacao: erros });
  }

  if (normalize(nome) !== TESTE_NOME_PERMITIDO) {
    return JSON.stringify({
      success: false,
      error:
        'Modo de teste: o cadastro esta limitado ao nome "AnnaAI Teste". ' +
        'Nenhum dado foi enviado ao sistema academico.',
    });
  }

  // Normalizar data para YYYY-MM-DD
  const br = dataNascimento.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  const dataIso = br ? `${br[3]}-${br[2]}-${br[1]}` : dataNascimento;

  const result = await cadastrarPessoa({
    nome,
    cpf,
    dataNascimento: dataIso,
    email,
    telefone,
    sexo: typeof args.sexo === 'string' ? args.sexo : undefined,
    endereco: typeof args.endereco === 'string' ? args.endereco : undefined,
    numero: typeof args.numero === 'string' ? args.numero : undefined,
    bairro: typeof args.bairro === 'string' ? args.bairro : undefined,
    cidade: typeof args.cidade === 'string' ? args.cidade : undefined,
    estado: typeof args.estado === 'string' ? args.estado : undefined,
    cep: typeof args.cep === 'string' ? args.cep : undefined,
  });

  if (result.success && result.codUsuarioPS) {
    return JSON.stringify({
      success: true,
      codUsuarioPS: result.codUsuarioPS,
      jaCadastrado: result.error === 'Pessoa ja cadastrada',
    });
  }

  return JSON.stringify({ success: false, error: result.error || 'Erro ao cadastrar candidato.' });
}

async function execRealizarInscricao(args: Record<string, unknown>): Promise<string> {
  const idps = String(args.idps ?? '');
  const idAreaInteresse = String(args.idAreaInteresse ?? '');
  const idHabilitacaoFilial = String(args.idHabilitacaoFilial ?? '');

  if (!(await isOfertaCursoLivre(idps, idAreaInteresse, idHabilitacaoFilial))) {
    return JSON.stringify({
      success: false,
      error:
        'Modo de teste: inscricoes estao limitadas aos cursos executivos (EVP / cursos livres). ' +
        'Nenhuma inscricao foi enviada ao sistema academico.',
    });
  }

  const result = await realizarInscricao({
    codUsuarioPS: String(args.codUsuarioPS ?? ''),
    nome: String(args.nomeCandidato ?? ''),
    selectedCourseData: {
      IDPS: String(args.idps ?? ''),
      IDAREAINTERESSE: String(args.idAreaInteresse ?? ''),
      IDHABILITACAOFILIAL: String(args.idHabilitacaoFilial ?? ''),
      IDPERLET: typeof args.idPerLet === 'string' && args.idPerLet ? args.idPerLet : undefined,
      CODCAMPUS: typeof args.codCampus === 'string' && args.codCampus ? args.codCampus : undefined,
      CURSO: String(args.curso ?? ''),
      NOMETIPOENSINO: typeof args.modalidade === 'string' ? args.modalidade : undefined,
    },
  });

  if (result.success) {
    return JSON.stringify({
      success: true,
      numeroInscricao: result.numeroInscricao ?? null,
      mensagem: 'Inscricao realizada com sucesso. Informe o numero da inscricao ao candidato.',
    });
  }

  return JSON.stringify({ success: false, error: result.error || 'Erro ao realizar inscricao.' });
}

/**
 * Executa uma tool de matricula. Retorna null se o nome nao for reconhecido
 * (permite encadear com outros executores, ex: buscar_calendario).
 */
export async function executeMatriculaTool(
  name: string,
  argsJson: string,
): Promise<string | null> {
  let args: Record<string, unknown> = {};
  try {
    args = JSON.parse(argsJson) as Record<string, unknown>;
  } catch {
    /* argumentos invalidos — segue com objeto vazio */
  }

  try {
    switch (name) {
      case 'consultar_cursos':
        return await execConsultarCursos(args);
      case 'buscar_candidato_por_cpf':
        return await execBuscarCandidato(args);
      case 'cadastrar_candidato':
        return await execCadastrarCandidato(args);
      case 'realizar_inscricao':
        return await execRealizarInscricao(args);
      default:
        return null;
    }
  } catch (error) {
    return JSON.stringify({
      success: false,
      error: `Falha ao comunicar com o sistema academico: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}

export const MATRICULA_TOOL_NAMES = MATRICULA_TOOL_DEFS.map((t) => t.function.name);
