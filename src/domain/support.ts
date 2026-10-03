/**
 * Pure domain entities and types for the Support & Knowledge Base Module
 * (AI Support).
 *
 * Directly mirrors the production schema from Supabase:
 * `ai_conversations` and `ai_messages`.
 *
 * This job reads historical conversations, identifies recurring user inquiries,
 * and proposes knowledge base / FAQ articles. The job is read-only regarding
 * production knowledge: proposing FAQ entries creates them in `proposed` status,
 * and final publication requires human director approval (ADR-0028).
 *
 * Hexagonal Architecture: pure domain, decoupled from SDKs and web frameworks.
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
  | 'access_rbac'
  | 'technical'
  | 'financial'
  | 'legal'
  | 'commercial'
  | 'operational'
  | 'data'
  | 'other'
  | 'acesso_rbac'
  | 'tecnico'
  | 'financeiro'
  | 'juridico'
  | 'comercial'
  | 'operacional'
  | 'dados'
  | 'outro';

export type FaqStatus = 'proposed' | 'approved' | 'rejected' | 'proposto' | 'aprovado' | 'rejeitado';

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