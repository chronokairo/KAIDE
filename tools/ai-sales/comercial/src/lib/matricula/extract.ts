import { normalize } from '@ciesa/anna-shared';
import {
  MATRICULA_DISCOVERY_FIELDS,
  MATRICULA_IDENTITY_FIELDS,
  MATRICULA_OFFER_FIELDS,
  type MatriculaDraft,
  type MatriculaDraftAnalysis,
  type MatriculaDraftField,
} from './types';
import {
  analyzeMatriculaDraft,
  normalizeModalidade,
  normalizeSemestreLetivo,
  normalizeTipoIngresso,
  normalizeTurno,
} from './validation';

const MATRICULA_INTENT_KEYWORDS = [
  'quero me matricular',
  'quero me inscrever',
  'fazer matricula',
  'fazer inscricao',
  'iniciar matricula',
  'iniciar inscricao',
  'matricular me',
  'me matricular',
  'me inscrever',
  'nova matricula',
  'nova inscricao',
  'transferencia para o ciesa',
  'portador de diploma',
];

const FIELD_LABELS: Record<MatriculaDraftField, string> = {
  nomeCompleto: 'nome completo',
  cpf: 'CPF',
  email: 'email',
  telefone: 'telefone com DDD',
  dataNascimento: 'data de nascimento',
  cursoNome: 'curso desejado',
  cursoId: 'identificador do curso',
  cursoNivel: 'nivel do curso',
  semestreLetivo: 'semestre letivo',
  modalidade: 'modalidade',
  turno: 'turno',
  tipoIngresso: 'tipo de ingresso',
  estado: 'estado',
  cidade: 'cidade',
  bairro: 'bairro ou unidade',
  consentimentoLGPD: 'aceite de privacidade',
  documentosEnviados: 'documentos',
};

function normalizeIntentText(value: string) {
  return normalize(value).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function formatLabel(field: MatriculaDraftField) {
  return FIELD_LABELS[field] ?? field;
}

function extractByPattern(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    return match[1].trim();
  }
  return '';
}

function cleanupCourseName(value: string) {
  return value
    .replace(/^(no|na|em)\s+/i, '')
    .replace(/^curso\s+de\s+/i, '')
    .replace(/^curso\s+/i, '')
    .trim();
}

function extractTelefone(text: string) {
  const matches = text.match(/(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?(?:9?\d{4})[-\s]?\d{4}\b/g);
  if (!matches?.length) return '';

  const phone = matches.find((value) => value.replace(/\D/g, '').length >= 10);
  return phone ?? '';
}

function extractSemestreLetivo(text: string) {
  return text.match(/\b\d{4}[.\/-]?[12]\b/)?.[0] ?? '';
}

function pickNextFields(analysis: MatriculaDraftAnalysis) {
  const identityMissing = MATRICULA_IDENTITY_FIELDS.filter((field) => analysis.missingFields.includes(field));
  if (identityMissing.length > 0) return identityMissing;

  const discoveryMissing = MATRICULA_DISCOVERY_FIELDS.filter((field) => analysis.missingFields.includes(field));
  if (discoveryMissing.length > 0) return discoveryMissing;

  const offerMissing = MATRICULA_OFFER_FIELDS.filter((field) => analysis.missingFields.includes(field));
  if (offerMissing.length > 0) return offerMissing;

  return analysis.missingFields;
}

export function isMatriculaIntent(text: string) {
  const normalizedValue = normalizeIntentText(text);
  return MATRICULA_INTENT_KEYWORDS.some((keyword) => normalizedValue.includes(keyword));
}

export function extractMatriculaDraftFromText(text: string): Partial<MatriculaDraft> {
  const emailMatch = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? '';
  const cpfMatch = text.match(/\b\d{3}\.?\d{3}\.?\d{3}-?\d{2}\b/)?.[0] ?? '';
  const birthDateMatch = text.match(/\b(?:\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})\b/)?.[0] ?? '';
  const nomeCompleto = extractByPattern(text, [
    /(?:me\s+chamo|meu\s+nome\s+e|meu\s+nome\s+é|sou)\s+([^,.!\n]+)/i,
  ]);
  const cursoNome = cleanupCourseName(extractByPattern(text, [
    /(?:curso\s+de|curso|cursar|matricular(?:-me)?\s+em|matricula\s+em|inscricao\s+em|interesse\s+em)\s+([^,.!\n]+)/i,
  ]));

  return {
    nomeCompleto,
    cpf: cpfMatch,
    email: emailMatch,
    telefone: extractTelefone(text),
    dataNascimento: birthDateMatch,
    cursoNome,
    modalidade: normalizeModalidade(text),
    turno: normalizeTurno(text),
    semestreLetivo: normalizeSemestreLetivo(extractSemestreLetivo(text)),
    tipoIngresso: normalizeTipoIngresso(text),
  };
}

export function buildMatriculaAssistantReply(analysis: MatriculaDraftAnalysis) {
  const lines: string[] = ['Posso conduzir sua matricula por aqui.'];
  const identified: string[] = [];

  if (analysis.draft.nomeCompleto) identified.push(`- Nome: ${analysis.draft.nomeCompleto}`);
  if (analysis.draft.cpf) identified.push(`- CPF: ${analysis.draft.cpf}`);
  if (analysis.draft.email) identified.push(`- Email: ${analysis.draft.email}`);
  if (analysis.draft.telefone) identified.push(`- Telefone: ${analysis.draft.telefone}`);
  if (analysis.draft.dataNascimento) identified.push(`- Nascimento: ${analysis.draft.dataNascimento}`);
  if (analysis.draft.cursoNome) identified.push(`- Curso: ${analysis.draft.cursoNome}`);
  if (analysis.draft.turno) identified.push(`- Turno: ${analysis.draft.turno}`);
  if (analysis.draft.modalidade) identified.push(`- Modalidade: ${analysis.draft.modalidade}`);
  if (analysis.draft.tipoIngresso) identified.push(`- Ingresso: ${analysis.draft.tipoIngresso}`);
  if (analysis.draft.semestreLetivo) identified.push(`- Semestre: ${analysis.draft.semestreLetivo}`);

  if (identified.length > 0) {
    lines.push('', 'Ja identifiquei estes dados:');
    lines.push(...identified);
  }

  const fieldErrors = Object.entries(analysis.fieldErrors);
  if (fieldErrors.length > 0) {
    lines.push('', 'Antes de seguir, preciso corrigir:');
    lines.push(...fieldErrors.map(([field, error]) => `- ${formatLabel(field as MatriculaDraftField)}: ${error}`));
  }

  if (analysis.readyForCandidateLookup) {
    lines.push('', 'Seu CPF ja esta em formato valido para consulta de cadastro.');
  }

  if (analysis.readyForReview) {
    lines.push('', 'O draft inicial ficou consistente. O proximo passo e consultar cadastro, localizar oferta e pedir sua confirmacao final.');
  } else {
    const nextFields = pickNextFields(analysis).filter((field) => field !== 'consentimentoLGPD');
    if (nextFields.length > 0) {
      lines.push('', 'Para continuar, me envie os proximos dados em linguagem natural:');
      lines.push(...nextFields.map((field) => `- ${formatLabel(field)}`));
    }
    if (analysis.missingFields.includes('consentimentoLGPD')) {
      lines.push('', 'Tambem vou precisar do seu aceite para o tratamento dos dados pessoais antes da confirmacao final.');
    }
  }

  if (analysis.requiredDocuments.length > 0) {
    lines.push('', 'Checklist documental previsto para este perfil:');
    lines.push(...analysis.requiredDocuments.map((document) => `- ${document.label}`));
  }

  return lines.join('\n');
}

export function analyzeMatriculaText(text: string) {
  return analyzeMatriculaDraft(extractMatriculaDraftFromText(text));
}