/**
 * Entidades e tipos de domínio do Módulo de Suporte & Base de Conhecimento
 * (AI Support).
 *
 * Mapeiam, em forma pura, as tabelas reais do Supabase de produção:
 * ai_conversations e ai_messages.
 *
 * O job apenas classifica conversas já existentes e propõe artigos de base de
 * conhecimento. Não publica nada: a curadoria do FAQ é do AI Support e a
 * publicação exige o Diretor (ADR-0028).
 *
 * Arquitetura Hexagonal: Domínio Puro (sem Supabase, Next, React ou SDKs).
 */

export type MessageRole = 'user' | 'assistant' | 'system' | 'tool';

export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  toolCalls?: unknown;
  toolResults?: unknown;
}

export interface ConversationThread {
  id: string;
  title: string;
  status: string;
  contractVersion?: string;
  createdAt: string;
  messages: ConversationMessage[];
}

export type TicketCategory =
  | 'acesso_rbac'
  | 'tecnico'
  | 'financeiro'
  | 'juridico'
  | 'comercial'
  | 'operacional'
  | 'dados'
  | 'outro';

export type FaqStatus = 'proposto' | 'aprovado' | 'rejeitado';

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
  category: TicketCategory;
  status: FaqStatus;
  sourceConversationIds: string[];
  occurrenceCount: number;
  confidence: number;
}

export interface RecurringIssue {
  signature: string;
  category: TicketCategory;
  occurrences: number;
  conversationIds: string[];
  sampleQuestion: string;
}

export interface SupportTriageReport {
  conversationsScannedCount: number;
  messagesScannedCount: number;
  byCategory: { category: TicketCategory; count: number }[];
  recurringIssues: RecurringIssue[];
  faqs: FaqEntry[];
  unansweredCount: number;
  generatedAt: string;
}

export interface SupportTriageJobResult {
  jobId: string;
  stage: 'support';
  requiresApproval: false;
  report: SupportTriageReport;
  createdAt: string;
}