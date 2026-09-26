import { normalize } from '@ciesa/anna-shared';
import {
  EMPTY_MATRICULA_DRAFT,
  MATRICULA_IDENTITY_FIELDS,
  MATRICULA_OFFER_FIELDS,
  MATRICULA_REVIEW_FIELDS,
  type MatriculaCursoNivel,
  type MatriculaDraft,
  type MatriculaDraftAnalysis,
  type MatriculaDraftField,
  type MatriculaModalidade,
  type MatriculaRequiredDocument,
  type MatriculaTipoIngresso,
  type MatriculaTurno,
} from './types';

const CPF_BLACKLIST = new Set([
  '00000000000',
  '11111111111',
  '22222222222',
  '33333333333',
  '44444444444',
  '55555555555',
  '66666666666',
  '77777777777',
  '88888888888',
  '99999999999',
  '12345678909',
  '01234567890',
]);

const BASE_DOCUMENTS: MatriculaRequiredDocument[] = [
  { id: 'rg', label: 'RG ou CNH' },
  { id: 'cpf_doc', label: 'CPF (documento)' },
  { id: 'comp_res', label: 'Comprovante de residencia' },
  { id: 'foto', label: 'Foto 3x4' },
];

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeLooseText(value: string) {
  return normalize(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? normalizeWhitespace(value) : '';
}

function parseBoolean(value: unknown) {
  if (typeof value === 'boolean') return value;
  if (typeof value !== 'string') return false;

  const normalizedValue = normalizeLooseText(value);
  return ['sim', 'true', 'aceito', 'ok', 'confirmo', 'autorizo'].includes(normalizedValue);
}

function isValidDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function normalizeBirthDate(value: unknown) {
  const raw = normalizeString(value);
  if (!raw) return '';

  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, year, month, day] = iso;
    return isValidDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : raw;
  }

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!br) return raw;

  const [, day, month, year] = br;
  return isValidDate(Number(year), Number(month), Number(day)) ? `${year}-${month}-${day}` : raw;
}

export function cleanCPF(value: string) {
  return value.replace(/\D/g, '').slice(0, 11);
}

export function cleanPhone(value: string) {
  return value.replace(/\D/g, '').slice(0, 15);
}

export function normalizeSemestreLetivo(value: unknown) {
  const raw = normalizeString(value);
  if (!raw) return '';

  const match = raw.match(/^(\d{4})[.\/-]?([12])$/);
  if (!match) return raw;
  return `${match[1]}.${match[2]}`;
}

export function inferCursoNivel(value: unknown): MatriculaCursoNivel {
  const normalizedValue = normalizeLooseText(normalizeString(value));
  if (!normalizedValue) return '';
  if (normalizedValue.includes('mestrado') || normalizedValue.includes('doutorado') || normalizedValue.includes('stricto')) {
    return 'pos_stricto';
  }
  if (
    normalizedValue.includes('mba') ||
    normalizedValue.includes('pos') ||
    normalizedValue.includes('especializacao') ||
    normalizedValue.includes('especializacao') ||
    normalizedValue.includes('lato')
  ) {
    return 'pos_lato';
  }
  if (normalizedValue.includes('curso livre') || normalizedValue.includes('extensao')) {
    return 'curso_livre';
  }
  return 'graduacao';
}

export function normalizeModalidade(value: unknown): MatriculaModalidade {
  const normalizedValue = normalizeLooseText(normalizeString(value));
  if (!normalizedValue) return '';
  if (
    normalizedValue.includes('distancia') ||
    normalizedValue.includes('ead') ||
    normalizedValue.includes('evp') ||
    normalizedValue.includes('mediacao tecnologica')
  ) {
    return 'distancia';
  }
  if (normalizedValue.includes('presencial')) {
    return 'presencial';
  }
  return '';
}

export function normalizeTurno(value: unknown): MatriculaTurno {
  const normalizedValue = normalizeLooseText(normalizeString(value));
  if (!normalizedValue) return '';
  if (normalizedValue.includes('ead')) return 'ead';
  if (normalizedValue.includes('manha') || normalizedValue.includes('matutino')) return 'matutino';
  if (normalizedValue.includes('tarde') || normalizedValue.includes('vespertino')) return 'vespertino';
  if (normalizedValue.includes('noite') || normalizedValue.includes('noturno')) return 'noturno';
  return '';
}

export function normalizeTipoIngresso(value: unknown): MatriculaTipoIngresso {
  const normalizedValue = normalizeLooseText(normalizeString(value));
  if (!normalizedValue) return '';
  if (normalizedValue.includes('transfer')) return 'transferencia_ies';
  if (normalizedValue.includes('diploma')) return 'portador_diploma';
  if (normalizedValue.includes('normal') || normalizedValue.includes('regular') || normalizedValue.includes('vestibular')) {
    return 'normal';
  }
  return '';
}

export function validateCPF(value: string) {
  const cleaned = cleanCPF(value);
  if (cleaned.length !== 11) return 'CPF deve ter 11 digitos';
  if (CPF_BLACKLIST.has(cleaned)) return 'CPF invalido';
  if (/^(\d)\1{10}$/.test(cleaned)) return 'CPF invalido';

  let sum = 0;
  for (let index = 0; index < 9; index += 1) {
    sum += Number(cleaned[index]) * (10 - index);
  }

  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(cleaned[9])) return 'CPF invalido';

  sum = 0;
  for (let index = 0; index < 10; index += 1) {
    sum += Number(cleaned[index]) * (11 - index);
  }

  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== Number(cleaned[10])) return 'CPF invalido';

  return '';
}

export function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? '' : 'Email invalido';
}

export function validatePhone(value: string) {
  const cleaned = cleanPhone(value);
  if (cleaned.length < 10) return 'Telefone deve conter DDD e numero';
  if (cleaned.length > 13) return 'Telefone invalido';
  return '';
}

export function validateBirthDate(value: string) {
  const normalizedValue = normalizeBirthDate(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) return 'Data de nascimento invalida';

  const [year, month, day] = normalizedValue.split('-').map(Number);
  if (!isValidDate(year, month, day)) return 'Data de nascimento invalida';

  const birthDate = new Date(Date.UTC(year, month - 1, day));
  const now = new Date();
  const age = now.getUTCFullYear() - birthDate.getUTCFullYear() - (now.getUTCMonth() < birthDate.getUTCMonth() || (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() < birthDate.getUTCDate()) ? 1 : 0);
  if (age < 14) return 'Idade minima para prosseguir e 14 anos';
  if (age > 120) return 'Data de nascimento invalida';

  return '';
}

export function getRequiredDocuments(
  tipoIngresso: MatriculaTipoIngresso,
  cursoNivel: MatriculaCursoNivel,
): MatriculaRequiredDocument[] {
  const documents = [...BASE_DOCUMENTS];

  if (tipoIngresso === 'normal') {
    documents.push(
      { id: 'cert_em', label: 'Certificado de conclusao do ensino medio' },
      { id: 'hist_em', label: 'Historico escolar do ensino medio' },
    );
  }

  if (tipoIngresso === 'portador_diploma') {
    documents.push(
      { id: 'diploma', label: 'Diploma de graduacao' },
      { id: 'hist_grad', label: 'Historico escolar da graduacao' },
    );
  }

  if (tipoIngresso === 'transferencia_ies') {
    documents.push(
      { id: 'hist_ies', label: 'Historico escolar da IES de origem' },
      { id: 'decl_trans', label: 'Declaracao de transferencia' },
    );
  }

  if (cursoNivel === 'pos_stricto') {
    documents.push(
      { id: 'projeto', label: 'Projeto de pesquisa' },
      { id: 'lattes', label: 'Curriculo Lattes' },
    );
  }

  return documents;
}

function hasValue(field: MatriculaDraftField, draft: MatriculaDraft) {
  const value = draft[field];
  if (typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.length > 0;
  return typeof value === 'string' ? value.trim().length > 0 : false;
}

function collectMissingFields(fields: readonly MatriculaDraftField[], draft: MatriculaDraft) {
  return fields.filter((field) => !hasValue(field, draft));
}

function buildFieldErrors(draft: MatriculaDraft) {
  const fieldErrors: Partial<Record<MatriculaDraftField, string>> = {};

  if (draft.nomeCompleto && draft.nomeCompleto.split(' ').length < 2) {
    fieldErrors.nomeCompleto = 'Informe nome e sobrenome';
  }

  if (draft.cpf) {
    const error = validateCPF(draft.cpf);
    if (error) fieldErrors.cpf = error;
  }

  if (draft.email) {
    const error = validateEmail(draft.email);
    if (error) fieldErrors.email = error;
  }

  if (draft.telefone) {
    const error = validatePhone(draft.telefone);
    if (error) fieldErrors.telefone = error;
  }

  if (draft.dataNascimento) {
    const error = validateBirthDate(draft.dataNascimento);
    if (error) fieldErrors.dataNascimento = error;
  }

  if (draft.semestreLetivo && !/^\d{4}\.[12]$/.test(draft.semestreLetivo)) {
    fieldErrors.semestreLetivo = 'Semestre deve estar no formato AAAA.1 ou AAAA.2';
  }

  return fieldErrors;
}

export function normalizeMatriculaDraft(input: Partial<MatriculaDraft> = {}): MatriculaDraft {
  const cursoNome = normalizeString(input.cursoNome);
  const cursoNivel = input.cursoNivel ? inferCursoNivel(input.cursoNivel) : inferCursoNivel(cursoNome);
  const tipoIngresso = normalizeTipoIngresso(input.tipoIngresso) || ((cursoNivel === 'pos_lato' || cursoNivel === 'pos_stricto') ? 'portador_diploma' : '');

  return {
    ...EMPTY_MATRICULA_DRAFT,
    nomeCompleto: normalizeString(input.nomeCompleto),
    cpf: cleanCPF(normalizeString(input.cpf)),
    email: normalizeString(input.email).toLowerCase(),
    telefone: cleanPhone(normalizeString(input.telefone)),
    dataNascimento: normalizeBirthDate(input.dataNascimento),
    cursoNome,
    cursoId: normalizeString(input.cursoId),
    cursoNivel,
    semestreLetivo: normalizeSemestreLetivo(input.semestreLetivo),
    modalidade: normalizeModalidade(input.modalidade),
    turno: normalizeTurno(input.turno),
    tipoIngresso,
    estado: normalizeString(input.estado).toUpperCase(),
    cidade: normalizeString(input.cidade),
    bairro: normalizeString(input.bairro),
    consentimentoLGPD: parseBoolean(input.consentimentoLGPD),
    documentosEnviados: Array.isArray(input.documentosEnviados)
      ? input.documentosEnviados.map((value) => normalizeString(value)).filter(Boolean)
      : [],
  };
}

export function analyzeMatriculaDraft(input: Partial<MatriculaDraft> = {}): MatriculaDraftAnalysis {
  const draft = normalizeMatriculaDraft(input);
  const fieldErrors = buildFieldErrors(draft);
  const requiredDocuments = getRequiredDocuments(draft.tipoIngresso, draft.cursoNivel);
  const uploaded = new Set(draft.documentosEnviados);
  const missingDocumentIds = requiredDocuments
    .map((document) => document.id)
    .filter((documentId) => !uploaded.has(documentId));
  const missingFields = Array.from(new Set([
    ...collectMissingFields(MATRICULA_REVIEW_FIELDS, draft),
  ]));

  const readyForCandidateLookup = draft.cpf.length === 11 && !fieldErrors.cpf;
  const readyForOfferSelection =
    collectMissingFields(MATRICULA_IDENTITY_FIELDS, draft).length === 0 &&
    !fieldErrors.nomeCompleto &&
    !fieldErrors.cpf &&
    !fieldErrors.email &&
    !fieldErrors.telefone &&
    !fieldErrors.dataNascimento &&
    !!draft.cursoNome;
  const readyForReview =
    collectMissingFields(MATRICULA_REVIEW_FIELDS, draft).length === 0 &&
    Object.keys(fieldErrors).length === 0;

  return {
    draft,
    fieldErrors,
    missingFields,
    requiredDocuments,
    missingDocumentIds,
    documentChecklistComplete: requiredDocuments.length > 0 && missingDocumentIds.length === 0,
    readyForCandidateLookup,
    readyForOfferSelection,
    readyForReview,
  };
}