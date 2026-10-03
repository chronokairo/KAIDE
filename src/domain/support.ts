/**
 * Pure domain entities and types for the Support & Operations Module (AI Support).
 *
 * Connected directly to official Supabase production tables:
 * - `support_tickets`
 * - `support_incidents`
 * - `ai_conversations`
 * - `ai_messages`
 *
 * Hexagonal Architecture: pure domain, decoupled from SDKs and web frameworks.
 */

export interface SupportTicket {
  id: string;
  code: string;
  clientName: string;
  subject: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed' | string;
  ownerName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface SupportIncident {
  id: string;
  code: string;
  systemName: string;
  severity: 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4' | string;
  status: 'Open' | 'Investigating' | 'Mitigated' | 'Resolved' | string;
  openedAt: string;
  createdAt: string;
  updatedAt?: string;
}

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
  | 'other';

export type FaqStatus = 'proposed' | 'approved' | 'rejected';

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
  ticketsScannedCount: number;
  incidentsScannedCount: number;
  conversationsScannedCount: number;
  messagesScannedCount: number;
  tickets: SupportTicket[];
  incidents: SupportIncident[];
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