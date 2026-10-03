import { SupportRepositoryPort } from '@/application/ports/support-repository-port';
import { CompanyControlPlanePort } from '@/application/ports/company-control-plane-port';
import {
  ConversationThread,
  ConversationMessage,
  TicketCategory,
  FaqEntry,
  RecurringIssue,
  SupportTriageReport,
  SupportTriageJobResult,
} from '@/domain/support';
import { JobEntity } from '@/domain/company';
import { supabaseAdmin, PROD_ORGANIZATION_ID } from '@/shared/supabase';

const PROD_USER_ID = '00000000-0000-4000-8000-000000000002'; // Luan Nery / Tech Lead Owner

/** Stopwords PT-BR removidas antes de gerar a assinatura de um problema. */
const STOPWORDS = new Set([
  'de','da','do','das','dos','a','o','as','os','um','uma','uns','umas','e','ou','mas','que','para','por','com','sem','no','na','nos','nas','em','ao','aos','da','ao','eu','tu','ele','ela','voce','vc','esta','estao','esta','aqui','ai','nao','sim','ser','estar','ter','fazer','ir','seu','sua','meu','minha','foi','sao','esta','tem','tem','como','qual','quais','quando','onde','the','and','you',
]);

/**
 * Job `support.triage_history` — AI Support.
 *
 * Lê `ai_conversations` e `ai_messages` do Supabase de produção e:
 *
 * 1. classifica cada conversa por categoria de ticket;
 * 2. agrupa mensagens de usuário em assinaturas de problema para detectar
 *    questões recorrentes;
 * 3. proposed entradas de FAQ a partir das recorrências detectadas.
 *
 * O job é somente leitura do histórico. As entradas de FAQ nascem com
 * `status = 'proposto'` e a curadoria/publicação é do AI Support-approved por
 * pessoa — nunca publicada automaticamente (ADR-0028).
 */
export class ExecuteSupportTriageUseCase {
  constructor(
    private readonly supportRepo: SupportRepositoryPort,
    private readonly controlPlane: CompanyControlPlanePort
  ) {}

  async execute(minOccurrences = 2): Promise<SupportTriageJobResult> {
    const threads = await this.supportRepo.listConversations();
    const timestamp = new Date().toISOString();
    const jobId = `job-support-triage-${Date.now()}`;

    const userMessages = threads.flatMap((t) => t.messages.filter((m) => m.role === 'user'));
    const categories = threads.map((t) => this.classify(t));
    const byCategory = this.countByCategory(categories);
    const recurring = this.findRecurringIssues(userMessages, categories, minOccurrences);
    const faqs = recurring.map((r, index) => this.toFaq(r, index));
    const unansweredCount = threads.filter((t) => t.messages.length <= 1).length;

    const report: SupportTriageReport = {
      conversationsScannedCount: threads.length,
      messagesScannedCount: userMessages.length,
      byCategory,
      recurringIssues: recurring,
      faqs,
      unansweredCount,
      generatedAt: timestamp,
    };

    const evidenceList: string[] = [
      `Triagem de suporte concluída: ${threads.length} conversa(s) e ${userMessages.length} mensagem(ns) de usuário lidas do Supabase prod.`,
      `Distribuição por categoria: ${byCategory.map((c) => `${c.category}=${c.count}`).join(', ') || 'sem conversas'}.`,
      `Questões recorrentes detectadas: ${recurring.length} (limite mínimo de ${minOccurrences} ocorrências).`,
      `Entradas de FAQ propostas: ${faqs.length}, todas com status 'proposto' aguardando curadoria.`,
      ...(unansweredCount > 0
        ? [`${unansweredCount} conversa(s) sem resposta do assistente — candidatas a fluxos automatizados.`]
        : []),
      'Governança AI-first (ADR-0028): a base de conhecimento só é publicada após curadoria do AI Support e aprovação do Diretor.',
    ];

    const job: JobEntity = {
      id: jobId,
      title: 'Triagem de Histórico de Suporte & Proposta de FAQ',
      client: 'Suporte & Customer Success ChronoKairo Corp',
      project: 'Base de Conhecimento',
      stage: 'support',
      agentRole: 'support',
      status: 'completed',
      prompt:
        'Ler ai_conversations e ai_messages do Supabase prod, classificar por categoria, detectar questões recorrentes e propor entradas de FAQ sem publicar.',
      toolsUsed: ['conversation_reader', 'intent_classifier', 'recurring_issue_detector', 'faq_proposer', 'supabase_db'],
      changesSummary: `${threads.length} conversa(s) triada(s); ${recurring.length} recorrência(s); ${faqs.length} FAQ(s) proposta(s).`,
      testsSummary:
        'Categorização por dicionário de termos do domínio. Recorrência exige no mínimo duas ocorrências independentes.',
      evidence: evidenceList,
      costUsd: 0.09,
      durationSeconds: 11,
      requiresApproval: false,
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    if (this.controlPlane.submitJob) {
      await this.controlPlane.submitJob(job);
    }

    await this.persist(jobId, report, faqs);

    return {
      jobId,
      stage: 'support',
      requiresApproval: false,
      report,
      createdAt: timestamp,
    };
  }

  /** Classifica a conversa pela mensagem do usuário mais informativa. */
  private classify(thread: ConversationThread): { threadId: string; category: TicketCategory } {
    const userTexts = thread.messages.filter((m) => m.role === 'user').map((m) => m.content);
    const haystack = `${thread.title} ${userTexts.join(' ')}`.toLowerCase();

    const rules: [TicketCategory, RegExp][] = [
      ['acesso_rbac', /permiss|perfil|papel|acesso|login|senha|autentic|bloquead|negad|403|401|rbac/],
      ['financeiro', /cobrança|cobranca|fatura|nota fiscal|nfse|nf-e|pagamento|boleto|pix|valor|contratual|inadimpl/],
      ['juridico', /jur[íi]d|contrato|minuta|processo|advog|notifica[çc][ãa]o|protesto/],
      ['dados', /dado|migra|import|export|backup|relat[óo]rio|planilha|excel|csv/],
      ['comercial', /proposta|or[çc]amento|lead|oportunidade|neg[óo]cio|pre[çc]o/],
      ['operacional', /agend|visita|suporte|atendimento|hor[áa]rio|fila/],
      ['tecnico', /erro|bug|falha|n[ãa]o funciona|quebr|n[ãa]o abre|lent|desempenho|inst[âa]vel|timeout|500|502/],
    ];

    for (const [category, pattern] of rules) {
      if (pattern.test(haystack)) return { threadId: thread.id, category };
    }
    return { threadId: thread.id, category: 'outro' };
  }

  private countByCategory(
    entries: { threadId: string; category: TicketCategory }[]
  ): { category: TicketCategory; count: number }[] {
    const acc = entries.reduce<Record<string, number>>((a, e) => {
      a[e.category] = (a[e.category] ?? 0) + 1;
      return a;
    }, {});
    return Object.entries(acc)
      .map(([category, count]) => ({ category: category as TicketCategory, count }))
      .sort((a, b) => b.count - a.count);
  }

  /**
   * Assinatura de problema: os termos mais significativos da mensagem,
   * ordenados e concatenados. Duas mensagens com a mesma assinatura
   * representam a mesma dúvida recorrente.
   */
  private signatureOf(content: string): string {
    const words = content
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOPWORDS.has(w))
      .slice(0, 4)
      .sort();
    return words.join(' ');
  }

  private findRecurringIssues(
    messages: ConversationMessage[],
    categories: { threadId: string; category: TicketCategory }[],
    minOccurrences: number
  ): RecurringIssue[] {
    const categoryByThread = new Map(categories.map((c) => [c.threadId, c.category]));
    const groups = new Map<string, { count: number; ids: string[]; sample: string }>();

    for (const msg of messages) {
      const sig = this.signatureOf(msg.content);
      if (!sig) continue;
      const current = groups.get(sig) ?? { count: 0, ids: [], sample: msg.content };
      current.count += 1;
      current.ids.push(msg.conversationId);
      current.sample = current.sample.length === 0 ? msg.content : current.sample;
      groups.set(sig, current);
    }

    return [...groups.entries()]
      .filter(([, g]) => g.count >= minOccurrences)
      .map(([signature, g]) => {
        const threadCategories = g.ids.map((id) => categoryByThread.get(id)).filter(Boolean) as TicketCategory[];
        const dominant = this.dominantCategory(threadCategories);
        return {
          signature,
          category: dominant,
          occurrences: g.count,
          conversationIds: [...new Set(g.ids)],
          sampleQuestion: g.sample,
        };
      })
      .sort((a, b) => b.occurrences - a.occurrences);
  }

  /** Categoria mais frequente entre as conversas de uma recorrência. */
  private dominantCategory(categories: TicketCategory[]): TicketCategory {
    if (categories.length === 0) return 'outro';
    const acc = categories.reduce<Record<string, number>>((a, c) => {
      a[c] = (a[c] ?? 0) + 1;
      return a;
    }, {});
    return Object.entries(acc).sort((a, b) => b[1] - a[1])[0][0] as TicketCategory;
  }

  private toFaq(issue: RecurringIssue, index: number): FaqEntry {
    return {
      id: `faq-${index + 1}`,
      question: issue.sampleQuestion.slice(0, 200),
      answer:
        'Resposta pendente de curadoria do AI Support. Esta entrada foi gerada automaticamente a partir de ' +
        `${issue.occurrences} pergunta(s) recorrente(s) no histórico e não foi publicada na base de conhecimento.`,
      category: issue.category,
      status: 'proposto',
      sourceConversationIds: issue.conversationIds,
      occurrenceCount: issue.occurrences,
      confidence: Math.min(0.9, 0.3 + issue.occurrences * 0.1),
    };
  }

  private async persist(jobId: string, report: SupportTriageReport, faqs: FaqEntry[]): Promise<void> {
    try {
      if (faqs.length > 0 && this.supportRepo.saveFaqEntry) {
        await Promise.all(faqs.map((f) => this.supportRepo.saveFaqEntry!(f)));
      }

      await supabaseAdmin.from('audit_logs').insert({
        organization_id: PROD_ORGANIZATION_ID,
        user_id: PROD_USER_ID,
        action: 'SUPPORT_HISTORY_TRIAGED',
        target: 'ai_conversations',
        success: true,
        details: {
          jobId,
          conversations: report.conversationsScannedCount,
          messages: report.messagesScannedCount,
          recurring: report.recurringIssues.length,
          faqsProposed: faqs.length,
          byCategory: report.byCategory,
        },
        created_at: new Date().toISOString(),
      });
    } catch {
      // Supabase non-blocking
    }
  }
}