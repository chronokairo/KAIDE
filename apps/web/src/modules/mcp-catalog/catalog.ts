import { z } from 'zod';
import type { ZodTypeAny } from 'zod';

export type McpToolCategory =
  | 'Gestao Academica'
  | 'Gestao de Pessoas'
  | 'Financeiro'
  | 'Secretaria'
  | 'Comunicacao'
  | 'Biblioteca'
  | 'Portal'
  | 'BI e Relatorios'
  | 'Integracoes'
  | 'Agente IA'
  | 'Auth'
  | 'Cadastros';

export interface McpToolField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'enum' | 'json';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
}

/** Descreve como a Anna pode acionar esta tool via upload de arquivo. */
export interface AnnaUploadConfig {
  /** Tipos MIME / extensões aceitos (ex.: 'application/pdf,.pdf') */
  accept: string;
  /** Palavras-chave que identificam esta intenção na mensagem do usuário */
  intentKeywords: string[];
  /** Texto descritivo exibido no chat antes da execução */
  describe: string;
}

export interface McpToolDefinition {
  name: string;
  category: McpToolCategory;
  title: string;
  description: string;
  version?: string;
  deprecated?: boolean;
  input: McpToolField[];
  outputHint: string;
  /** Presente quando a Anna pode acionar esta tool a partir de um upload de arquivo */
  annaUpload?: AnnaUploadConfig;
}

export interface McpToolCatalogEntry extends McpToolDefinition {
    requiredFields: string[];
    inputSchema: ZodTypeAny;
    outputSchema: ZodTypeAny;
}

function buildInputSchema(fields: McpToolField[]): ZodTypeAny {
    const shape: Record<string, ZodTypeAny> = {};
    for (const field of fields) {
        let fieldType: ZodTypeAny;
        
        switch (field.type) {
            case 'string':
                fieldType = z.string();
                break;
            case 'number':
                fieldType = z.number();
                break;
            case 'boolean':
                fieldType = z.boolean();
                break;
            case 'enum':
                if (field.options && field.options.length > 0) {
                    fieldType = z.enum(field.options as [string, ...string[]]);
                } else {
                    fieldType = z.string();
                }
                break;
            case 'json':
                fieldType = z.any(); // Or z.record(z.any())
                break;
            default:
                fieldType = z.any();
        }

        if (!field.required) {
            fieldType = fieldType.optional();
        }

        shape[field.name] = fieldType.describe(field.label);
    }
    return z.object(shape).passthrough();
}

function buildOutputSchema(hint: string): ZodTypeAny {
    const parsed = hint.replace(/[{}]/g, '').split(',').map(s => s.trim()).filter(Boolean);
    const shape: Record<string, ZodTypeAny> = {};
    for (const field of parsed) {
        const isOptional = field.endsWith('?');
        const cleanField = field.replace('?', '');
        if (cleanField === 'success') {
            shape[cleanField] = z.boolean();
        } else {
            shape[cleanField] = isOptional ? z.any().optional() : z.any();
        }
    }
    return z.object(shape).passthrough();
}

export const mcpToolsBase: McpToolDefinition[] = [
  // ─── Gestao Academica ───────────────────────────────────────
  {
    name: 'edu_upsert_entities',
    category: 'Gestao Academica',
    title: 'Upsert de entidades academicas',
    version: '1.0.0',
    deprecated: true,
    description: 'Cadastra ou atualiza alunos, turmas, cursos e disciplinas.',
    input: [
      { name: 'entityType', label: 'Tipo de entidade', type: 'enum', required: true, options: ['student', 'class', 'course', 'subject'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true, placeholder: '{ "name": "..." }' },
    ],
    outputHint: '{ success, entityId, version }',
  },
  {
    name: 'edu_batch_upsert',
    category: 'Gestao Academica',
    title: 'Upsert em lote de entidades',
    version: '2.0.0',
    description: 'Versao moderna que aceita multiplas entidades de uma vez.',
    input: [
      { name: 'entities', label: 'Entidades', type: 'json', required: true },
    ],
    outputHint: '{ success, results }',
  },
  {
    name: 'edu_enroll_student',
    category: 'Gestao Academica',
    title: 'Matricular/rematricular aluno',
    description: 'Matricula com validacao de pre-requisitos.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
      { name: 'mode', label: 'Modo', type: 'enum', required: true, options: ['enroll', 'reenroll'] },
      { name: 'validatePrerequisites', label: 'Validar pre-requisitos', type: 'boolean' },
    ],
    outputHint: '{ success, enrollmentId, warnings }',
  },
  {
    name: 'enroll_student',
    category: 'Gestao Academica',
    title: 'Matricular novo aluno (conversacional)',
    description: 'Matricula um NOVO aluno a partir de dados informados em conversa (sem PDF). Cria o intake, analisa e gera a proposta de matricula com sugestao de turma. Use quando o usuario pedir para matricular/inscrever um aluno novo informando nome, CPF e curso.',
    input: [
      { name: 'studentName', label: 'Nome do aluno', type: 'string', required: true },
      { name: 'cpf', label: 'CPF', type: 'string', required: true, placeholder: '123.456.789-09' },
      { name: 'programId', label: 'ID do curso/programa', type: 'string', required: true, placeholder: 'PROG-ADM' },
      { name: 'entryType', label: 'Tipo de ingresso', type: 'enum', options: ['CALOURO', 'TRANSFER_INTERNAL', 'TRANSFER_EXTERNAL', 'REOPTION', 'RETURN_AFTER_JUBILATION', 'DIPLOMA_HOLDER'] },
    ],
    outputHint: '{ success, intakeId, status, suggestedLevel, placement, equivalencesCount, warnings, note }',
  },
  {
    name: 'enroll_transcript',
    category: 'Gestao Academica',
    title: 'Processar historico escolar (PDF)',
    description: 'Analisa PDF de historico escolar, extrai disciplinas, identifica equivalencias e sugere turma de matricula.',
    input: [
      { name: 'base64', label: 'PDF em base64', type: 'string', required: true },
      { name: 'programId', label: 'ID do programa', type: 'string', placeholder: 'PROG-001' },
      { name: 'entryType', label: 'Tipo de ingresso', type: 'enum', options: ['DIPLOMA_HOLDER', 'TRANSFER', 'SISU', 'PROUNI', 'FIES', 'VESTIBULAR', 'INGRESSO_DIRETO'] },
    ],
    outputHint: '{ success, intakeId, studentName, components, equivalences, placement, warnings }',
    annaUpload: {
      accept: 'application/pdf,.pdf',
      intentKeywords: ['historico', 'transcript', 'diploma', 'equivalencia', 'transferencia', 'aproveitamento'],
      describe: 'Anna identificou: **Historico escolar** — processando equivalencias e sugerindo turma.',
    },
  },
  {
    name: 'enroll_batch',
    category: 'Gestao Academica',
    title: 'Importar candidatos em lote (CSV)',
    description: 'Importa lista de candidatos a partir de arquivo CSV. Valida CPF, detecta duplicatas e cria intakes.',
    input: [
      { name: 'csv', label: 'Conteudo CSV', type: 'string', required: true },
      { name: 'skipDuplicates', label: 'Ignorar duplicatas', type: 'boolean' },
    ],
    outputHint: '{ success, created, skipped, errors, results }',
    annaUpload: {
      accept: 'text/csv,.csv,text/plain',
      intentKeywords: ['importar', 'candidatos', 'alunos', 'lote', 'planilha', 'lista', 'batch', 'csv'],
      describe: 'Anna identificou: **Importacao em lote por CSV** — processando candidatos/alunos do arquivo.',
    },
  },
  {
    name: 'edu_record_grades_attendance',
    category: 'Gestao Academica',
    title: 'Lancar notas e frequencia',
    description: 'Lanca notas, faltas e conceitos.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
      { name: 'periodId', label: 'Periodo', type: 'string', required: true },
      { name: 'records', label: 'Registros', type: 'json', required: true, placeholder: '[{"studentId":"...","grade":9}]' },
    ],
    outputHint: '{ success, processed, rejected }',
  },
  {
    name: 'edu_get_academic_documents',
    category: 'Gestao Academica',
    title: 'Gerar documentos academicos',
    description: 'Gera boletim, historico e declaracoes.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'documentType', label: 'Documento', type: 'enum', required: true, options: ['report_card', 'history', 'declaration'] },
      { name: 'periodId', label: 'Periodo', type: 'string' },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['pdf', 'json'] },
    ],
    outputHint: '{ success, documentUrl?, data? }',
  },
  {
    name: 'edu_manage_curriculum',
    category: 'Gestao Academica',
    title: 'Gerenciar grade curricular',
    description: 'Controla componentes curriculares e carga horaria.',
    input: [
      { name: 'courseId', label: 'ID do curso', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['add', 'update', 'remove', 'reorder'] },
      { name: 'components', label: 'Componentes', type: 'json', required: true },
    ],
    outputHint: '{ success, curriculumId, totalHours }',
  },
  {
    name: 'edu_manage_school_calendar',
    category: 'Gestao Academica',
    title: 'Calendario letivo',
    description: 'Gerencia calendario, provas, eventos e feriados.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'delete', 'list'] },
      { name: 'calendarEntries', label: 'Entradas', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, entries }',
  },
  {
    name: 'edu_attendance_alerts',
    category: 'Gestao Academica',
    title: 'Alertas de infrequencia',
    description: 'Apura frequencia e emite alertas.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string' },
      { name: 'thresholdPercent', label: 'Limite (%)', type: 'number', required: true },
      { name: 'periodId', label: 'Periodo', type: 'string', required: true },
    ],
    outputHint: '{ success, alerts }',
  },
  {
    name: 'edu_progression_rules',
    category: 'Gestao Academica',
    title: 'Progressao/retencao',
    description: 'Controla recuperacao, progressao e retencao.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
      { name: 'action', label: 'Acao', type: 'enum', required: true, options: ['recovery', 'progress', 'retain'] },
      { name: 'justification', label: 'Justificativa', type: 'string' },
    ],
    outputHint: '{ success, decision, nextSteps }',
  },

  // ─── Gestao de Pessoas ───────────────────────────────────────
  {
    name: 'hr_upsert_staff',
    category: 'Gestao de Pessoas',
    title: 'Upsert de staff',
    description: 'Cadastra/atualiza professores, coordenadores e funcionarios.',
    input: [
      { name: 'roleType', label: 'Tipo', type: 'enum', required: true, options: ['teacher', 'coordinator', 'staff'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, staffId }',
  },
  {
    name: 'hr_assign_teacher_workload',
    category: 'Gestao de Pessoas',
    title: 'Atribuir carga docente',
    description: 'Atribui turmas/disciplinas e controla carga horaria.',
    input: [
      { name: 'teacherId', label: 'ID do professor', type: 'string', required: true },
      { name: 'assignments', label: 'Atribuicoes', type: 'json', required: true },
    ],
    outputHint: '{ success, assigned, conflicts }',
  },
  {
    name: 'hr_manage_contracts',
    category: 'Gestao de Pessoas',
    title: 'Gerenciar contratos',
    description: 'Controla contratos, jornada e carga horaria.',
    input: [
      { name: 'employeeId', label: 'ID do funcionario', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'terminate'] },
      { name: 'contract', label: 'Contrato', type: 'json', required: true },
    ],
    outputHint: '{ success, contractId, status }',
  },
  {
    name: 'hr_time_and_absence',
    category: 'Gestao de Pessoas',
    title: 'Ponto e ausencias',
    description: 'Registra ponto e ausencias.',
    input: [
      { name: 'employeeId', label: 'ID do funcionario', type: 'string', required: true },
      { name: 'action', label: 'Acao', type: 'enum', required: true, options: ['clock_in', 'clock_out', 'absence'] },
      { name: 'timestamp', label: 'Timestamp', type: 'string' },
      { name: 'reason', label: 'Motivo', type: 'string' },
    ],
    outputHint: '{ success, recordId }',
  },
  {
    name: 'hr_teacher_performance',
    category: 'Gestao de Pessoas',
    title: 'Avaliacao de desempenho',
    description: 'Avaliacao de desempenho docente.',
    input: [
      { name: 'teacherId', label: 'ID do professor', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['record', 'list'] },
      { name: 'evaluation', label: 'Avaliacao', type: 'json' },
      { name: 'periodId', label: 'Periodo', type: 'string' },
    ],
    outputHint: '{ success, evaluations }',
  },
  {
    name: 'hr_leave_management',
    category: 'Gestao de Pessoas',
    title: 'Ferias e afastamentos',
    description: 'Gerencia ferias e afastamentos.',
    input: [
      { name: 'employeeId', label: 'ID do funcionario', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['request', 'approve', 'reject', 'list'] },
      { name: 'leave', label: 'Dados', type: 'json' },
    ],
    outputHint: '{ success, leaveRequestId?, status?, items? }',
  },

  // ─── Financeiro ───────────────────────────────────────
  {
    name: 'fin_issue_charges',
    category: 'Financeiro',
    title: 'Emitir cobranca/boleto',
    description: 'Emite boletos, cobrancas e contratos financeiros.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['issue_invoice', 'issue_boleto', 'create_contract'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, chargeId?, contractId?, paymentLink? }',
  },
  {
    name: 'fin_collection_workflow',
    category: 'Financeiro',
    title: 'Regua de cobranca',
    description: 'Controla inadimplencia e regua de cobranca.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['run', 'list'] },
      { name: 'filters', label: 'Filtros', type: 'json' },
      { name: 'strategy', label: 'Estrategia', type: 'json' },
    ],
    outputHint: '{ success, debtors, actionsScheduled }',
  },
  {
    name: 'fin_scholarship_and_discounts',
    category: 'Financeiro',
    title: 'Bolsas e descontos',
    description: 'Aplica parcelamentos, descontos e bolsas.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['apply_discount', 'apply_scholarship', 'create_installment'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, financialPlanId }',
  },
  {
    name: 'fin_payment_gateway_sync',
    category: 'Financeiro',
    title: 'Sync gateway de pagamento',
    description: 'Integra e sincroniza pagamentos com gateways.',
    input: [
      { name: 'gateway', label: 'Gateway', type: 'enum', required: true, options: ['pagseguro', 'stripe', 'asaas', 'other'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['sync', 'reconcile'] },
      { name: 'range', label: 'Periodo', type: 'json' },
    ],
    outputHint: '{ success, imported, failed }',
  },
  {
    name: 'fin_cashflow_reports',
    category: 'Financeiro',
    title: 'Relatorios financeiros',
    description: 'Fluxo de caixa, DRE e relatorios financeiros.',
    input: [
      { name: 'reportType', label: 'Tipo', type: 'enum', required: true, options: ['cashflow', 'dre', 'financial_summary'] },
      { name: 'range', label: 'Periodo', type: 'json', required: true },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['json', 'pdf', 'xlsx'] },
    ],
    outputHint: '{ success, reportUrl?, data? }',
  },
  {
    name: 'fin_bank_reconciliation',
    category: 'Financeiro',
    title: 'Conciliacao bancaria',
    description: 'Concilia transacoes bancarias.',
    input: [
      { name: 'accountId', label: 'Conta', type: 'string', required: true },
      { name: 'range', label: 'Periodo', type: 'json', required: true },
      { name: 'mode', label: 'Modo', type: 'enum', required: true, options: ['auto', 'manual_review'] },
    ],
    outputHint: '{ success, matched, pending, conflicts }',
  },
  {
    name: 'fin_service_contracts',
    category: 'Financeiro',
    title: 'Contratos de servico',
    description: 'Contratos de servico e adimplencia.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'status'] },
      { name: 'studentId', label: 'ID do aluno', type: 'string' },
      { name: 'contractId', label: 'ID do contrato', type: 'string' },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, contractStatus?, delinquencyLevel? }',
  },

  // ─── Secretaria ───────────────────────────────────────
  {
    name: 'sec_issue_documents',
    category: 'Secretaria',
    title: 'Emitir documentos',
    description: 'Emite declaracoes, atestados e certificados.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'documentType', label: 'Tipo', type: 'enum', required: true, options: ['declaration', 'attestation', 'certificate'] },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['pdf', 'docx'] },
    ],
    outputHint: '{ success, documentId, documentUrl }',
  },
  {
    name: 'sec_protocol_requests',
    category: 'Secretaria',
    title: 'Protocolar solicitacoes',
    description: 'Protocola e rastreia solicitacoes.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['open', 'update', 'track'] },
      { name: 'request', label: 'Solicitacao', type: 'json' },
      { name: 'protocolId', label: 'ID do protocolo', type: 'string' },
    ],
    outputHint: '{ success, protocolId, status, timeline }',
  },
  {
    name: 'sec_student_documents',
    category: 'Secretaria',
    title: 'Documentos do aluno',
    description: 'Armazena e valida documentos do aluno.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['upload', 'list', 'validate'] },
      { name: 'files', label: 'Arquivos', type: 'json' },
      { name: 'checklist', label: 'Checklist', type: 'json' },
    ],
    outputHint: '{ success, documents, pendingItems }',
  },
  {
    name: 'sec_generate_service_contract',
    category: 'Secretaria',
    title: 'Contrato de prestacao de servico',
    description: 'Gera contrato educacional.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'planId', label: 'ID do plano', type: 'string', required: true },
      { name: 'templateId', label: 'ID do template', type: 'string' },
      { name: 'signMode', label: 'Modo assinatura', type: 'enum', options: ['manual', 'digital'] },
    ],
    outputHint: '{ success, contractId, contractUrl }',
  },
  {
    name: 'sec_meeting_minutes_archive',
    category: 'Secretaria',
    title: 'Atas de conselho',
    description: 'Arquivo de atas e conselhos de classe.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'list'] },
      { name: 'payload', label: 'Payload', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, minutes }',
  },

  // ─── Comunicacao ───────────────────────────────────────
  {
    name: 'notify_send',
    category: 'Comunicacao',
    title: 'Enviar notificacoes',
    description: 'Envia uma notificacao a um destinatario por email, SMS, push ou webhook (com fallback entre canais).',
    input: [
      { name: 'recipientId', label: 'ID do destinatario', type: 'string', required: true },
      { name: 'subject', label: 'Assunto', type: 'string', required: true },
      { name: 'body', label: 'Corpo da mensagem', type: 'string', required: true },
      { name: 'channels', label: 'Canais', type: 'json', placeholder: '["email","sms"]' },
    ],
    outputHint: '{ success, dispatchId, queued }',
  },
  {
    name: 'com_segmented_announcements',
    category: 'Comunicacao',
    title: 'Comunicados segmentados',
    description: 'Dispara comunicados por turma, curso ou perfil.',
    input: [
      { name: 'segment', label: 'Segmento', type: 'json', required: true },
      { name: 'subject', label: 'Assunto', type: 'string', required: true },
      { name: 'content', label: 'Conteudo', type: 'string', required: true },
      { name: 'priority', label: 'Prioridade', type: 'enum', options: ['low', 'normal', 'high'] },
    ],
    outputHint: '{ success, recipients, announcementId }',
  },
  {
    name: 'com_crm_occurrences',
    category: 'Comunicacao',
    title: 'Ocorrencias CRM',
    description: 'Registra ocorrencias e atendimentos.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'list'] },
      { name: 'payload', label: 'Payload', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, occurrenceId?, items? }',
  },
  {
    name: 'com_messaging_channel',
    category: 'Comunicacao',
    title: 'Canal de mensagens',
    description: 'Mensagens entre responsaveis, alunos e instituicao.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['send', 'list'] },
      { name: 'threadId', label: 'Thread', type: 'string' },
      { name: 'fromId', label: 'De', type: 'string' },
      { name: 'toId', label: 'Para', type: 'string' },
      { name: 'text', label: 'Texto', type: 'string' },
    ],
    outputHint: '{ success, messageId?, thread? }',
  },
  {
    name: 'com_schedule_events',
    category: 'Comunicacao',
    title: 'Agenda de eventos',
    description: 'Agenda reunioes e eventos com notificacao.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'cancel', 'list'] },
      { name: 'event', label: 'Evento', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, eventId?, items? }',
  },

  // ─── Biblioteca ───────────────────────────────────────
  {
    name: 'lib_manage_collection',
    category: 'Biblioteca',
    title: 'Acervo e emprestimos',
    description: 'Acervo, emprestimos, devolucoes e reservas.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['catalog', 'loan', 'return', 'reserve', 'search'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, transactionId?, itemStatus?, items? }',
  },
  {
    name: 'lib_manage_facilities',
    category: 'Biblioteca',
    title: 'Laboratorios e salas',
    description: 'Controla laboratorios, salas e equipamentos.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create', 'update', 'list', 'allocate'] },
      { name: 'resourceType', label: 'Tipo', type: 'enum', required: true, options: ['lab', 'room', 'equipment'] },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, resourceId?, resources? }',
  },
  {
    name: 'lib_schedule_spaces',
    category: 'Biblioteca',
    title: 'Agendar espacos',
    description: 'Agenda espacos fisicos.',
    input: [
      { name: 'resourceId', label: 'ID do recurso', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['book', 'cancel', 'list'] },
      { name: 'booking', label: 'Reserva', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, bookingId?, bookings? }',
  },
  {
    name: 'lib_assets_inventory',
    category: 'Biblioteca',
    title: 'Inventario de patrimonio',
    description: 'Inventario de patrimonio.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['audit', 'list', 'adjust'] },
      { name: 'payload', label: 'Payload', type: 'json' },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, inventoryReport?, discrepancies? }',
  },

  // ─── Portal ───────────────────────────────────────
  {
    name: 'portal_get_student_view',
    category: 'Portal',
    title: 'Visao do aluno',
    description: 'Notas, frequencia e agenda.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'include', label: 'Incluir', type: 'json', required: true, placeholder: '["grades","attendance","calendar"]' },
    ],
    outputHint: '{ success, grades?, attendance?, calendar? }',
  },
  {
    name: 'portal_learning_materials',
    category: 'Portal',
    title: 'Materiais e tarefas',
    description: 'Acessa materiais didaticos e tarefas.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['list_materials', 'list_tasks', 'submit_task'] },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, items?, submissionId? }',
  },
  {
    name: 'portal_request_services',
    category: 'Portal',
    title: 'Solicitar servicos',
    description: 'Solicita documentos e servicos.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'serviceType', label: 'Tipo de servico', type: 'string', required: true },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, protocolId }',
  },
  {
    name: 'portal_financial_view',
    category: 'Portal',
    title: 'Financeiro do aluno',
    description: 'Financeiro e pagamentos.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['statement', 'open_invoices', 'payment_history'] },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'portal_communication_history',
    category: 'Portal',
    title: 'Historico de comunicacoes',
    description: 'Retorna historico de comunicacoes.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, messages }',
  },

  // ─── BI e Relatorios ───────────────────────────────────────
  {
    name: 'bi_kpi_dashboards',
    category: 'BI e Relatorios',
    title: 'Dashboard de KPIs',
    description: 'Evasao, inadimplencia e desempenho medio.',
    input: [
      { name: 'indicators', label: 'Indicadores', type: 'json', required: true },
      { name: 'range', label: 'Periodo', type: 'json', required: true },
      { name: 'dimensions', label: 'Dimensoes', type: 'json' },
    ],
    outputHint: '{ success, kpis, charts }',
  },
  {
    name: 'bi_regulatory_reports',
    category: 'BI e Relatorios',
    title: 'Relatorios regulatorios',
    description: 'Censo, e-MEC e INEP.',
    input: [
      { name: 'reportType', label: 'Tipo', type: 'enum', required: true, options: ['censo', 'e_mec', 'inep'] },
      { name: 'referencePeriod', label: 'Periodo referencia', type: 'string', required: true },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['pdf', 'xlsx', 'json'] },
    ],
    outputHint: '{ success, reportUrl?, payload? }',
  },
  {
    name: 'bi_dropout_risk',
    category: 'BI e Relatorios',
    title: 'Risco de evasao',
    description: 'Predicao de cancelamento.',
    input: [
      { name: 'scope', label: 'Escopo', type: 'json', required: true },
      { name: 'modelVersion', label: 'Versao do modelo', type: 'string' },
    ],
    outputHint: '{ success, riskList }',
  },
  {
    name: 'bi_capacity_seasonality',
    category: 'BI e Relatorios',
    title: 'Ocupacao e sazonalidade',
    description: 'Ocupacao de turmas e sazonalidade.',
    input: [
      { name: 'period', label: 'Periodo', type: 'json', required: true },
      { name: 'granularity', label: 'Granularidade', type: 'enum', required: true, options: ['month', 'quarter', 'year'] },
    ],
    outputHint: '{ success, occupancy, seasonality }',
  },
  {
    name: 'bi_export_data',
    category: 'BI e Relatorios',
    title: 'Exportar dados',
    description: 'Exporta dados em PDF, Excel, CSV e JSON.',
    input: [
      { name: 'dataset', label: 'Dataset', type: 'string', required: true },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['pdf', 'xlsx', 'csv', 'json'] },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, exportUrl?, data? }',
  },

  // ─── Integracoes ───────────────────────────────────────
  {
    name: 'int_sync_lms',
    category: 'Integracoes',
    title: 'Sync LMS',
    description: 'Moodle, Canvas e Google Classroom.',
    input: [
      { name: 'provider', label: 'Provedor', type: 'enum', required: true, options: ['moodle', 'canvas', 'google_classroom'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['sync_users', 'sync_classes', 'sync_grades'] },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, synced, errors }',
  },
  {
    name: 'int_sync_payments',
    category: 'Integracoes',
    title: 'Sync pagamentos',
    description: 'PagSeguro, Stripe e Asaas.',
    input: [
      { name: 'provider', label: 'Provedor', type: 'enum', required: true, options: ['pagseguro', 'stripe', 'asaas'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create_charge', 'sync_status', 'refund'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, providerRef?, status? }',
  },
  {
    name: 'int_sync_fiscal_erp',
    category: 'Integracoes',
    title: 'Sync fiscal/ERP',
    description: 'SIEG, Omie e Conta Azul.',
    input: [
      { name: 'provider', label: 'Provedor', type: 'enum', required: true, options: ['sieg', 'omie', 'conta_azul'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['sync_invoices', 'sync_taxes', 'sync_ledger'] },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, processed, failed }',
  },
  {
    name: 'int_government_apis',
    category: 'Integracoes',
    title: 'APIs governamentais',
    description: 'SISU, FIES, ProUni, Receita.',
    input: [
      { name: 'source', label: 'Fonte', type: 'enum', required: true, options: ['sisu', 'fies', 'prouni', 'receita'] },
      { name: 'operation', label: 'Operacao', type: 'string', required: true },
      { name: 'params', label: 'Parametros', type: 'json', required: true },
    ],
    outputHint: '{ success, data, traceId? }',
  },
  {
    name: 'int_video_conference',
    category: 'Integracoes',
    title: 'Videoconferencia',
    description: 'Google Meet, Zoom, Teams.',
    input: [
      { name: 'provider', label: 'Provedor', type: 'enum', required: true, options: ['google_meet', 'zoom', 'teams', 'other'] },
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['create_meeting', 'update_meeting', 'cancel_meeting'] },
      { name: 'payload', label: 'Payload', type: 'json', required: true },
    ],
    outputHint: '{ success, meetingId?, meetingUrl? }',
  },
  {
    name: 'int_webhooks_automation',
    category: 'Integracoes',
    title: 'Webhooks e automacao',
    description: 'Zapier, n8n, Make.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['register', 'trigger', 'list', 'disable'] },
      { name: 'target', label: 'Destino', type: 'enum', required: true, options: ['zapier', 'n8n', 'make', 'custom'] },
      { name: 'payload', label: 'Payload', type: 'json' },
    ],
    outputHint: '{ success, webhookId?, deliveries? }',
  },
  {
    name: 'edu_reserve_vacancy',
    category: 'Gestao Academica',
    title: 'Reservar/liberar vaga em turma',
    description: 'Reserva ou libera vaga em uma turma para pre-matricula, com suporte a lista de espera.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['reserve', 'release', 'check'] },
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
      { name: 'cpf', label: 'CPF do candidato', type: 'string', required: true },
      { name: 'intakeId', label: 'ID do intake', type: 'string' },
      { name: 'reserveDays', label: 'Dias de reserva', type: 'number', placeholder: '7' },
    ],
    outputHint: '{ success, classId, reservedUntil, waitlistPosition? }',
  },
  {
    name: 'edu_confirm_enrollment',
    category: 'Gestao Academica',
    title: 'Efetivar matricula (pre -> ativa)',
    description: 'Transiciona o intake de pre-matricula para matricula efetivada apos confirmacao de pagamento.',
    input: [
      { name: 'intakeId', label: 'ID do intake', type: 'string', required: true },
      { name: 'paymentReference', label: 'Referencia do pagamento', type: 'string' },
    ],
    outputHint: '{ success, enrollmentId, protocol, enrolledAt }',
  },
  {
    name: 'int_cep_lookup',
    category: 'Integracoes',
    title: 'Consulta de CEP (ViaCEP)',
    description: 'Busca dados de endereco a partir do CEP via proxy ViaCEP. Usado para auto-preenchimento de formularios.',
    input: [
      { name: 'cep', label: 'CEP', type: 'string', required: true, placeholder: '01310-100' },
    ],
    outputHint: '{ zip, street, neighborhood, city, state, complement? }',
  },

  // ─── Cadastros — Unidades ─────────────────────────────
  {
    name: 'units_list',
    category: 'Cadastros',
    title: 'Listar unidades / campus',
    description: 'Lista todas as unidades/campus cadastradas no sistema. Você TEM acesso direto a esta funcionalidade através deste tool. Chame-o sempre que precisar listar unidades, não peça informações ao usuário.',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'units_create',
    category: 'Cadastros',
    title: 'Criar unidade / campus',
    description:
      'Cria uma nova unidade ou campus. Se o usuário fornecer nome e cidade/estado, chame imediatamente — não peça confirmação. ' +
      'Após sucesso, informe o ID gerado.',
    input: [
      { name: 'name',    label: 'Nome',          type: 'string', required: true,  placeholder: 'Campus Centro' },
      { name: 'city',    label: 'Cidade',         type: 'string', required: false, placeholder: 'Manaus' },
      { name: 'state',   label: 'Estado (UF)',    type: 'string', required: false, placeholder: 'AM' },
      { name: 'address', label: 'Endereço',       type: 'string', required: false },
      { name: 'phone',   label: 'Telefone',       type: 'string', required: false },
      { name: 'email',   label: 'E-mail',         type: 'string', required: false },
      { name: 'status',  label: 'Status',         type: 'enum',   required: false, options: ['ATIVO', 'INATIVO'], placeholder: 'ATIVO' },
    ],
    outputHint: '{ success, id, name, code, city, state, status }',
  },
  {
    name: 'units_update',
    category: 'Cadastros',
    title: 'Editar unidade / campus',
    description:
      'Atualiza os dados de uma unidade existente. IMPORTANTE: O parâmetro "id" deve ser o UUID da unidade (formato: a4e2c3d0-edd9-...). Se o usuário fornecer apenas o NOME (ex: "Campus Centro"), CÓDIGO (ex: "2") ou POSIÇÃO na tabela, você DEVE: 1) Chamar units_list primeiro, 2) Buscar a unidade pelo nome/código na lista, 3) Usar o UUID encontrado. Use quando o usuário pedir para editar, corrigir ou atualizar dados de uma unidade.',
    input: [
      { name: 'id',      label: 'ID da unidade (UUID)',  type: 'string', required: true, placeholder: 'a4e2c3d0-edd9-4a0e-b8a3-64ced8286538' },
      { name: 'name',    label: 'Nome',            type: 'string', required: false },
      { name: 'city',    label: 'Cidade',          type: 'string', required: false },
      { name: 'state',   label: 'Estado (UF)',     type: 'string', required: false },
      { name: 'address', label: 'Endereço',        type: 'string', required: false },
      { name: 'phone',   label: 'Telefone',        type: 'string', required: false },
      { name: 'email',   label: 'E-mail',          type: 'string', required: false },
      { name: 'status',  label: 'Status',          type: 'enum',   required: false, options: ['ATIVO', 'INATIVO'] },
    ],
    outputHint: '{ success, id, name, city, state, status }',
  },
  {
    name: 'units_delete',
    category: 'Cadastros',
    title: 'Excluir unidade / campus',
    description: 'Remove permanentemente uma unidade. ATENÇÃO: O parâmetro "id" deve ser o UUID da unidade (exemplo: a4e2c3d0-edd9-...). Se o usuário fornecer apenas o NOME (ex: "Campus Norte"), CÓDIGO (ex: "3") ou POSIÇÃO na tabela, você DEVE: 1) Chamar units_list primeiro, 2) Buscar a unidade pelo nome/código na lista, 3) Usar o UUID encontrado. Confirme com o usuário antes de excluir mostrando o nome completo da unidade.',
    input: [
      { name: 'id', label: 'ID da unidade (UUID)', type: 'string', required: true, placeholder: 'a4e2c3d0-edd9-4a0e-b8a3-64ced8286538' },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Cadastros — Níveis de Ensino ─────────────────────
  {
    name: 'levels_list',
    category: 'Cadastros',
    title: 'Listar níveis de ensino',
    description: 'Lista todos os níveis de ensino (ex: Graduação, Pós-Graduação, Técnico).',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'levels_create',
    category: 'Cadastros',
    title: 'Criar nível de ensino',
    description: 'Cadastra um novo nível de ensino no sistema.',
    input: [
      { name: 'name',        label: 'Nome',       type: 'string', required: true,  placeholder: 'Graduação' },
      { name: 'code',        label: 'Código',     type: 'string', required: true,  placeholder: 'GRADUACAO' },
      { name: 'order',       label: 'Ordem',      type: 'number', required: true,  placeholder: '1' },
      { name: 'description', label: 'Descrição',  type: 'string', required: false },
    ],
    outputHint: '{ success, id, name, code, order, status }',
  },
  {
    name: 'levels_update',
    category: 'Cadastros',
    title: 'Editar nível de ensino',
    description: 'Atualiza um nível de ensino existente. Requer o id.',
    input: [
      { name: 'id',          label: 'ID',        type: 'string', required: true },
      { name: 'name',        label: 'Nome',       type: 'string', required: false },
      { name: 'code',        label: 'Código',     type: 'string', required: false },
      { name: 'order',       label: 'Ordem',      type: 'number', required: false },
      { name: 'description', label: 'Descrição',  type: 'string', required: false },
      { name: 'status',      label: 'Status',     type: 'enum',   required: false, options: ['active', 'inactive'] },
    ],
    outputHint: '{ success, id, name, code, order, status }',
  },
  {
    name: 'levels_delete',
    category: 'Cadastros',
    title: 'Excluir nível de ensino',
    description: 'Remove permanentemente um nível de ensino. Requer o id. Confirme com o usuário antes de excluir.',
    input: [
      { name: 'id', label: 'ID', type: 'string', required: true },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Cadastros — Processos Seletivos ──────────────────
  {
    name: 'exams_list',
    category: 'Cadastros',
    title: 'Listar processos seletivos',
    description: 'Lista todos os processos seletivos cadastrados.',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'exams_create',
    category: 'Cadastros',
    title: 'Criar processo seletivo',
    description: 'Cria um novo processo seletivo (vestibular/sisu/etc.).',
    input: [
      { name: 'name',        label: 'Nome',            type: 'string', required: true,  placeholder: 'Vestibular 2026/1' },
      { name: 'year',        label: 'Ano',             type: 'number', required: true,  placeholder: '2026' },
      { name: 'semester',    label: 'Semestre',        type: 'number', required: true,  placeholder: '1' },
      { name: 'startDate',   label: 'Início',          type: 'string', required: true,  placeholder: '2026-01-15' },
      { name: 'endDate',     label: 'Término',         type: 'string', required: true,  placeholder: '2026-03-01' },
      { name: 'description', label: 'Descrição',       type: 'string', required: false },
      { name: 'vacancies',   label: 'Vagas',           type: 'number', required: false, placeholder: '100' },
    ],
    outputHint: '{ success, id, name, year, semester, status }',
  },
  {
    name: 'exams_update',
    category: 'Cadastros',
    title: 'Editar processo seletivo',
    description: 'Atualiza um processo seletivo existente. Requer o id.',
    input: [
      { name: 'id',          label: 'ID',         type: 'string', required: true },
      { name: 'name',        label: 'Nome',        type: 'string', required: false },
      { name: 'year',        label: 'Ano',         type: 'number', required: false },
      { name: 'semester',    label: 'Semestre',    type: 'number', required: false },
      { name: 'startDate',   label: 'Início',      type: 'string', required: false },
      { name: 'endDate',     label: 'Término',     type: 'string', required: false },
      { name: 'description', label: 'Descrição',   type: 'string', required: false },
      { name: 'vacancies',   label: 'Vagas',       type: 'number', required: false },
      { name: 'status',      label: 'Status',      type: 'enum',   required: false, options: ['draft', 'open', 'closed', 'finished'] },
    ],
    outputHint: '{ success, id, name, status }',
  },
  {
    name: 'exams_delete',
    category: 'Cadastros',
    title: 'Excluir processo seletivo',
    description: 'Remove permanentemente um processo seletivo. Requer o id. Confirme com o usuário antes de excluir.',
    input: [
      { name: 'id', label: 'ID', type: 'string', required: true },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Cadastros — Disciplinas ──────────────────────────
  {
    name: 'subjects_list',
    category: 'Cadastros',
    title: 'Listar disciplinas',
    description: 'Lista todas as disciplinas cadastradas.',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'subjects_create',
    category: 'Cadastros',
    title: 'Criar disciplina',
    description: 'Cadastra uma nova disciplina.',
    input: [
      { name: 'name',     label: 'Nome',        type: 'string', required: true,  placeholder: 'Cálculo I' },
      { name: 'code',     label: 'Código',      type: 'string', required: false, placeholder: 'MAT101' },
      { name: 'courseId', label: 'ID do curso', type: 'string', required: false },
      { name: 'workload', label: 'Carga horária', type: 'number', required: false, placeholder: '60' },
      { name: 'credits',  label: 'Créditos',    type: 'number', required: false, placeholder: '4' },
      { name: 'semester', label: 'Semestre',    type: 'number', required: false, placeholder: '1' },
    ],
    outputHint: '{ success, id, name, code, courseId, workload, credits }',
  },
  {
    name: 'subjects_update',
    category: 'Cadastros',
    title: 'Editar disciplina',
    description: 'Atualiza uma disciplina existente. Requer o id.',
    input: [
      { name: 'id',       label: 'ID',           type: 'string', required: true },
      { name: 'name',     label: 'Nome',          type: 'string', required: false },
      { name: 'code',     label: 'Código',        type: 'string', required: false },
      { name: 'courseId', label: 'ID do curso',   type: 'string', required: false },
      { name: 'workload', label: 'Carga horária', type: 'number', required: false },
      { name: 'credits',  label: 'Créditos',      type: 'number', required: false },
      { name: 'semester', label: 'Semestre',      type: 'number', required: false },
    ],
    outputHint: '{ success, id, name, code }',
  },
  {
    name: 'subjects_delete',
    category: 'Cadastros',
    title: 'Excluir disciplina',
    description: 'Remove permanentemente uma disciplina. Requer o id. Confirme com o usuário antes de excluir.',
    input: [
      { name: 'id', label: 'ID', type: 'string', required: true },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Cadastros — Modalidades ──────────────────────────
  {
    name: 'modalities_list',
    category: 'Cadastros',
    title: 'Listar modalidades',
    description: 'Lista todas as modalidades de ensino (Presencial, EAD, etc.).',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'modalities_create',
    category: 'Cadastros',
    title: 'Criar modalidade',
    description: 'Cadastra uma nova modalidade de ensino.',
    input: [
      { name: 'name',        label: 'Nome',       type: 'string', required: true,  placeholder: 'Semipresencial' },
      { name: 'code',        label: 'Código',     type: 'string', required: true,  placeholder: 'SEMIPRESENCIAL' },
      { name: 'description', label: 'Descrição',  type: 'string', required: false },
    ],
    outputHint: '{ success, id, name, code, status }',
  },
  {
    name: 'modalities_update',
    category: 'Cadastros',
    title: 'Editar modalidade',
    description: 'Atualiza uma modalidade existente. Requer o id.',
    input: [
      { name: 'id',          label: 'ID',         type: 'string', required: true },
      { name: 'name',        label: 'Nome',        type: 'string', required: false },
      { name: 'code',        label: 'Código',      type: 'string', required: false },
      { name: 'description', label: 'Descrição',   type: 'string', required: false },
      { name: 'status',      label: 'Status',      type: 'enum',   required: false, options: ['active', 'inactive'] },
    ],
    outputHint: '{ success, id, name, code, status }',
  },
  {
    name: 'modalities_delete',
    category: 'Cadastros',
    title: 'Excluir modalidade',
    description: 'Remove permanentemente uma modalidade. Requer o id. Confirme com o usuário antes de excluir.',
    input: [
      { name: 'id', label: 'ID', type: 'string', required: true },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Cadastros — Cursos ───────────────────────────────
  {
    name: 'courses_list',
    category: 'Cadastros',
    title: 'Listar cursos',
    description: 'Lista todos os cursos cadastrados no sistema.',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'courses_create',
    category: 'Cadastros',
    title: 'Criar curso',
    description: 'Cadastra um novo curso.',
    input: [
      { name: 'name',        label: 'Nome',           type: 'string', required: true,  placeholder: 'Engenharia Civil' },
      { name: 'modality',    label: 'Modalidade',     type: 'string', required: true,  placeholder: 'PRESENCIAL' },
      { name: 'level',       label: 'Nível',          type: 'string', required: true,  placeholder: 'GRADUACAO' },
      { name: 'workload',    label: 'Carga horária',  type: 'number', required: true,  placeholder: '3600' },
      { name: 'code',        label: 'Código',         type: 'string', required: false },
      { name: 'duration',    label: 'Duração (sem.)', type: 'number', required: false, placeholder: '8' },
      { name: 'description', label: 'Descrição',      type: 'string', required: false },
    ],
    outputHint: '{ success, id, name, code, modality, level, status }',
  },
  {
    name: 'courses_update',
    category: 'Cadastros',
    title: 'Editar curso',
    description: 'Atualiza um curso existente. Requer o id.',
    input: [
      { name: 'id',          label: 'ID',              type: 'string', required: true },
      { name: 'name',        label: 'Nome',             type: 'string', required: false },
      { name: 'code',        label: 'Código',           type: 'string', required: false },
      { name: 'modality',    label: 'Modalidade',       type: 'string', required: false },
      { name: 'level',       label: 'Nível',            type: 'string', required: false },
      { name: 'duration',    label: 'Duração (sem.)',   type: 'number', required: false },
      { name: 'workload',    label: 'Carga horária',    type: 'number', required: false },
      { name: 'description', label: 'Descrição',        type: 'string', required: false },
      { name: 'status',      label: 'Status',           type: 'enum',   required: false, options: ['ACTIVE', 'INACTIVE'] },
    ],
    outputHint: '{ success, id, name, code, status }',
  },
  {
    name: 'courses_delete',
    category: 'Cadastros',
    title: 'Excluir curso',
    description: 'Remove permanentemente um curso. Requer o id. Confirme com o usuário antes de excluir.',
    input: [
      { name: 'id', label: 'ID', type: 'string', required: true },
    ],
    outputHint: '{ success, message }',
  },

  // ─── Agente IA ───────────────────────────────────────
  {
    name: 'ai_natural_language_query',
    category: 'Agente IA',
    title: 'Consulta em linguagem natural',
    description: 'Interpreta consultas em linguagem natural.',
    input: [
      { name: 'query', label: 'Consulta', type: 'string', required: true },
      { name: 'context', label: 'Contexto', type: 'json' },
      { name: 'role', label: 'Papel', type: 'string' },
    ],
    outputHint: '{ success, interpretation, answer?, suggestedTools? }',
  },
  {
    name: 'ai_orchestrate_actions',
    category: 'Agente IA',
    title: 'Orquestrar acoes',
    description: 'Executa fluxos complexos por instrucao.',
    input: [
      { name: 'instruction', label: 'Instrucao', type: 'string', required: true },
      { name: 'dryRun', label: 'Dry run', type: 'boolean' },
      { name: 'context', label: 'Contexto', type: 'json' },
    ],
    outputHint: '{ success, plan, executed, rollback? }',
  },
  {
    name: 'ai_report_generator',
    category: 'Agente IA',
    title: 'Gerador de relatorios',
    description: 'Gera relatorios sob demanda.',
    input: [
      { name: 'prompt', label: 'Prompt', type: 'string', required: true },
      { name: 'format', label: 'Formato', type: 'enum', required: true, options: ['pdf', 'xlsx', 'json'] },
      { name: 'filters', label: 'Filtros', type: 'json' },
    ],
    outputHint: '{ success, reportUrl?, data? }',
  },
  {
    name: 'ai_proactive_alerts',
    category: 'Agente IA',
    title: 'Alertas proativos',
    description: 'Sugere acoes proativas.',
    input: [
      { name: 'domains', label: 'Dominios', type: 'json', required: true },
      { name: 'thresholds', label: 'Limites', type: 'json' },
      { name: 'schedule', label: 'Agenda', type: 'json' },
    ],
    outputHint: '{ success, alerts, recommendations }',
  },
  {
    name: 'ai_context_memory',
    category: 'Agente IA',
    title: 'Memoria de contexto',
    description: 'Memoria para fluxos multi-etapa.',
    input: [
      { name: 'operation', label: 'Operacao', type: 'enum', required: true, options: ['save', 'load', 'clear'] },
      { name: 'sessionId', label: 'Sessao', type: 'string', required: true },
      { name: 'context', label: 'Contexto', type: 'json' },
    ],
    outputHint: '{ success, context? }',
  },
  {
    name: 'auth_tool_permission_guard',
    category: 'Auth',
    title: 'Guarda de permissoes',
    description: 'Controle de permissoes por papel.',
    input: [
      { name: 'userId', label: 'ID do usuario', type: 'string', required: true },
      { name: 'role', label: 'Papel', type: 'string', required: true },
      { name: 'toolName', label: 'Tool', type: 'string', required: true },
      { name: 'action', label: 'Acao', type: 'string', required: true },
    ],
    outputHint: '{ success, allowed, reason? }',
  },

  // ─── Alunos (consulta/gestão) ──────────────────────────────
  {
    name: 'students_list',
    category: 'Gestao Academica',
    title: 'Listar alunos',
    description: 'Lista alunos matriculados com paginação e busca.',
    input: [
      { name: 'search', label: 'Busca (nome/email/cpf)', type: 'string' },
      { name: 'page', label: 'Página', type: 'number' },
      { name: 'limit', label: 'Itens por página', type: 'number' },
    ],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'student_history',
    category: 'Gestao Academica',
    title: 'Histórico acadêmico do aluno',
    description: 'Retorna o histórico acadêmico completo de um aluno.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'students_create',
    category: 'Gestao Academica',
    title: 'Criar aluno',
    description: 'Cria um novo aluno no sistema.',
    input: [
      { name: 'name', label: 'Nome', type: 'string', required: true },
      { name: 'documents', label: 'Documentos', type: 'json' },
      { name: 'contact', label: 'Contato', type: 'json' },
    ],
    outputHint: '{ success, id }',
  },
  {
    name: 'students_update',
    category: 'Gestao Academica',
    title: 'Atualizar aluno',
    description: 'Atualiza dados de um aluno existente.',
    input: [
      { name: 'id', label: 'ID do aluno', type: 'string', required: true },
    ],
    outputHint: '{ success }',
  },

  // ─── Turmas ─────────────────────────────────────────────────
  {
    name: 'classes_list',
    category: 'Gestao Academica',
    title: 'Listar turmas',
    description: 'Lista turmas com filtros opcionais.',
    input: [
      { name: 'courseId', label: 'ID do curso', type: 'string' },
      { name: 'period', label: 'Período', type: 'string' },
      { name: 'status', label: 'Status', type: 'string' },
    ],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'class_roster',
    category: 'Gestao Academica',
    title: 'Listar alunos da turma',
    description: 'Lista alunos matriculados em uma turma específica.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
    ],
    outputHint: '{ success, items }',
  },
  {
    name: 'class_seats',
    category: 'Gestao Academica',
    title: 'Vagas disponíveis na turma',
    description: 'Retorna vagas disponíveis em uma turma.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
    ],
    outputHint: '{ success, available, capacity }',
  },
  {
    name: 'class_assign_teacher',
    category: 'Gestao Academica',
    title: 'Atribuir professor à turma',
    description: 'Atribui um professor a uma turma.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
      { name: 'teacherUserId', label: 'ID do professor', type: 'string', required: true },
    ],
    outputHint: '{ success }',
  },

  // ─── Frequência ─────────────────────────────────────────────
  {
    name: 'attendance_class',
    category: 'Gestao Academica',
    title: 'Relatório de frequência da turma',
    description: 'Relatório de frequência de todos os alunos de uma turma.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'attendance_student',
    category: 'Gestao Academica',
    title: 'Relatório de frequência do aluno',
    description: 'Relatório de frequência individual de um aluno.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },

  // ─── Notas / Avaliações ─────────────────────────────────────
  {
    name: 'grades_class',
    category: 'Gestao Academica',
    title: 'Relatório de notas da turma',
    description: 'Boletim/relatório de notas de todos os alunos de uma turma.',
    input: [
      { name: 'classId', label: 'ID da turma', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'grades_student',
    category: 'Gestao Academica',
    title: 'Relatório de notas do aluno',
    description: 'Relatório de notas individual de um aluno.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'report_card',
    category: 'Gestao Academica',
    title: 'Boletim do aluno',
    description: 'Boletim escolar completo de um aluno.',
    input: [
      { name: 'studentId', label: 'ID do aluno', type: 'string', required: true },
    ],
    outputHint: '{ success, data }',
  },

  // ─── Financeiro ─────────────────────────────────────────────
  {
    name: 'fin_receivables',
    category: 'Financeiro',
    title: 'Listar contas a receber',
    description: 'Lista contas a receber com filtros.',
    input: [
      { name: 'status', label: 'Status', type: 'string' },
      { name: 'studentId', label: 'ID do aluno', type: 'string' },
    ],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'fin_delinquency',
    category: 'Financeiro',
    title: 'Inadimplência',
    description: 'Relatório de inadimplência (saldos e atrasos).',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'fin_cashflow',
    category: 'Financeiro',
    title: 'Fluxo de caixa',
    description: 'Relatório de fluxo de caixa por período.',
    input: [
      { name: 'startDate', label: 'Data início', type: 'string' },
      { name: 'endDate', label: 'Data fim', type: 'string' },
    ],
    outputHint: '{ success, data }',
  },
  {
    name: 'fin_summary',
    category: 'Financeiro',
    title: 'Relatório financeiro consolidado',
    description: 'Relatório financeiro consolidado por período.',
    input: [
      { name: 'period', label: 'Período', type: 'string' },
    ],
    outputHint: '{ success, data }',
  },

  // ─── Biblioteca ─────────────────────────────────────────────
  {
    name: 'books_search',
    category: 'Biblioteca',
    title: 'Buscar livros',
    description: 'Busca livros por título, autor, assunto ou disponibilidade.',
    input: [
      { name: 'search', label: 'Busca', type: 'string' },
      { name: 'assunto', label: 'Assunto', type: 'string' },
      { name: 'disponivel', label: ' Só disponíveis', type: 'string' },
    ],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'books_loans',
    category: 'Biblioteca',
    title: 'Listar empréstimos',
    description: 'Lista empréstimos da biblioteca.',
    input: [
      { name: 'status', label: 'Status', type: 'string' },
    ],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'books_overdue',
    category: 'Biblioteca',
    title: 'Listar empréstimos atrasados',
    description: 'Lista empréstimos em atraso.',
    input: [],
    outputHint: '{ success, items, total }',
  },
  {
    name: 'books_renew',
    category: 'Biblioteca',
    title: 'Renovar empréstimo',
    description: 'Renova um empréstimo da biblioteca.',
    input: [
      { name: 'id', label: 'ID do empréstimo', type: 'string', required: true },
    ],
    outputHint: '{ success }',
  },

  // ─── Mensagens ──────────────────────────────────────────────
  {
    name: 'msg_send',
    category: 'Comunicacao',
    title: 'Enviar mensagem interna',
    description: 'Envia uma mensagem interna para um usuário.',
    input: [
      { name: 'to', label: 'Destinatário (ID)', type: 'string', required: true },
      { name: 'subject', label: 'Assunto', type: 'string' },
      { name: 'body', label: 'Mensagem', type: 'string', required: true },
    ],
    outputHint: '{ success }',
  },
  {
    name: 'msg_inbox',
    category: 'Comunicacao',
    title: 'Listar mensagens recebidas',
    description: 'Lista mensagens recebidas por um usuário.',
    input: [
      { name: 'userId', label: 'ID do usuário', type: 'string', required: true },
    ],
    outputHint: '{ success, items }',
  },

  // ─── Dashboard / Relatórios ─────────────────────────────────
  {
    name: 'rpt_dashboard',
    category: 'BI e Relatorios',
    title: 'Métricas do dashboard',
    description: 'Retorna métricas gerais do painel.',
    input: [],
    outputHint: '{ success, items }',
  },
  {
    name: 'rpt_seats',
    category: 'BI e Relatorios',
    title: 'Vagas disponíveis',
    description: 'Retorna vagas disponíveis por curso.',
    input: [],
    outputHint: '{ success, items }',
  },
  {
    name: 'rpt_evasion',
    category: 'BI e Relatorios',
    title: 'Indicadores de evasão',
    description: 'Retorna indicadores de evasão e retenção.',
    input: [
      { name: 'evasionGoal', label: 'Meta de evasão (%)', type: 'number' },
      { name: 'retentionGoal', label: 'Meta de retenção (%)', type: 'number' },
    ],
    outputHint: '{ success, data }',
  },
];

export const mcpToolCatalog: McpToolCatalogEntry[] = mcpToolsBase.map(tool => {
    return {
        ...tool,
        version: tool.version || '1.0.0',
        deprecated: tool.deprecated || false,
        requiredFields: tool.input.filter(f => f.required).map(f => f.name),
        inputSchema: buildInputSchema(tool.input),
        outputSchema: buildOutputSchema(tool.outputHint)
    };
});

export const mcpTools = mcpToolCatalog;

export const mcpToolCategories: McpToolCategory[] = [
  'Gestao Academica',
  'Gestao de Pessoas',
  'Financeiro',
  'Secretaria',
  'Comunicacao',
  'Biblioteca',
  'Portal',
  'BI e Relatorios',
  'Integracoes',
  'Agente IA',
  'Auth',
];

export function groupToolsByCategory(): Record<McpToolCategory, McpToolCatalogEntry[]> {
  const grouped = {} as Record<McpToolCategory, McpToolCatalogEntry[]>;
  for (const category of mcpToolCategories) {
    grouped[category] = mcpToolCatalog.filter((tool) => tool.category === category);
  }
  return grouped;
}

export function findTool(name: string): McpToolCatalogEntry | undefined {
  return mcpToolCatalog.find((tool) => tool.name === name);
}

export function findCatalogEntry(name: string): McpToolCatalogEntry | undefined {
    return findTool(name);
}

export interface McpInvocationResult {
    success: boolean;
    tool: string;
    category: string;
    status: 'stub' | 'backend_unavailable' | 'backend_error';
    message: string;
    echo?: Record<string, unknown>;
    outputHint?: string;
    missingFields?: string[];
    error?: string;
    input?: Record<string, unknown>;
    backendResponse?: any;
    executed?: boolean;
    fallback?: boolean;
    plan?: any;
}

/** Retorna todas as tools que a Anna pode acionar a partir de upload de arquivo. */
export function getAnnaUploadTools(): McpToolDefinition[] {
  return mcpToolsBase.filter((t) => !!t.annaUpload);
}

export function invokeToolStub(toolName: string, input: Record<string, unknown>): McpInvocationResult | null {
    const entry = findCatalogEntry(toolName);
    if (!entry) return null;

    const missing = entry.requiredFields.filter((field) => {
        const value = input?.[field];
        return value === undefined || value === null || value === '';
    });

    if (missing.length > 0) {
        return {
            success: false,
            tool: entry.name,
            category: entry.category,
            status: 'stub',
            message: `Campos obrigatorios ausentes para ${entry.name}: ${missing.join(', ')}`,
            echo: input || {},
            outputHint: entry.outputHint,
            missingFields: missing,
        };
    }

    return {
        success: true,
        tool: entry.name,
        category: entry.category,
        status: 'stub',
        message: `Execucao stub de ${entry.name} concluida. Integre com o servico real para efeitos reais.`,
        echo: input || {},
        outputHint: entry.outputHint,
    };
}
