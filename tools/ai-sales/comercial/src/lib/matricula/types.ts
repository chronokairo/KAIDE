export type MatriculaCursoNivel = '' | 'graduacao' | 'pos_lato' | 'pos_stricto' | 'curso_livre';

export type MatriculaModalidade = '' | 'presencial' | 'distancia';

export type MatriculaTurno = '' | 'matutino' | 'vespertino' | 'noturno' | 'ead';

export type MatriculaTipoIngresso = '' | 'normal' | 'portador_diploma' | 'transferencia_ies';

export interface MatriculaRequiredDocument {
  id: string;
  label: string;
}

export interface MatriculaDraft {
  nomeCompleto: string;
  cpf: string;
  email: string;
  telefone: string;
  dataNascimento: string;
  cursoNome: string;
  cursoId: string;
  cursoNivel: MatriculaCursoNivel;
  semestreLetivo: string;
  modalidade: MatriculaModalidade;
  turno: MatriculaTurno;
  tipoIngresso: MatriculaTipoIngresso;
  estado: string;
  cidade: string;
  bairro: string;
  consentimentoLGPD: boolean;
  documentosEnviados: string[];
}

export type MatriculaDraftField = keyof MatriculaDraft;

export interface MatriculaDraftAnalysis {
  draft: MatriculaDraft;
  fieldErrors: Partial<Record<MatriculaDraftField, string>>;
  missingFields: MatriculaDraftField[];
  requiredDocuments: MatriculaRequiredDocument[];
  missingDocumentIds: string[];
  documentChecklistComplete: boolean;
  readyForCandidateLookup: boolean;
  readyForOfferSelection: boolean;
  readyForReview: boolean;
}

export const EMPTY_MATRICULA_DRAFT: MatriculaDraft = {
  nomeCompleto: '',
  cpf: '',
  email: '',
  telefone: '',
  dataNascimento: '',
  cursoNome: '',
  cursoId: '',
  cursoNivel: '',
  semestreLetivo: '',
  modalidade: '',
  turno: '',
  tipoIngresso: '',
  estado: '',
  cidade: '',
  bairro: '',
  consentimentoLGPD: false,
  documentosEnviados: [],
};

export const MATRICULA_IDENTITY_FIELDS: readonly MatriculaDraftField[] = [
  'nomeCompleto',
  'cpf',
  'email',
  'telefone',
  'dataNascimento',
];

export const MATRICULA_DISCOVERY_FIELDS: readonly MatriculaDraftField[] = [
  'cursoNome',
  'cursoNivel',
];

export const MATRICULA_OFFER_FIELDS: readonly MatriculaDraftField[] = [
  'semestreLetivo',
  'modalidade',
  'turno',
  'tipoIngresso',
  'estado',
  'cidade',
  'bairro',
];

export const MATRICULA_REVIEW_FIELDS: readonly MatriculaDraftField[] = [
  ...MATRICULA_IDENTITY_FIELDS,
  ...MATRICULA_DISCOVERY_FIELDS,
  ...MATRICULA_OFFER_FIELDS,
  'consentimentoLGPD',
];