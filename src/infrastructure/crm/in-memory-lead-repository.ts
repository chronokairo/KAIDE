import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { Lead, FollowupDraft } from '@/domain/commercial';

export class InMemoryLeadRepository implements LeadRepositoryPort {
  private leads: Lead[] = [
    {
      id: 'lead-001',
      name: 'InovaHealth Soluções Médicas',
      company: 'InovaHealth',
      contactPerson: 'Dra. Camila Santos',
      contactRole: 'Diretora Médica & Inovação',
      email: 'camila.santos@inovahealth.com.br',
      phone: '+55 11 98877-6655',
      segment: 'Saúde & Medicina Ocupacional',
      score: 88,
      stage: 'qualification',
      needsSummary: 'Necessidade de integração de prontuários com módulo ASO ocupacional e auditoria LGPD.',
      lastContactDate: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
      daysWithoutContact: 4,
      priority: 'high',
      status: 'awaiting_followup',
    },
    {
      id: 'lead-002',
      name: 'Alpha Finanças & Investimentos',
      company: 'Alpha Finanças S/A',
      contactPerson: 'Rodrigo Lima',
      contactRole: 'CTO',
      email: 'rodrigo.lima@alphafin.com.br',
      phone: '+55 11 97766-5544',
      segment: 'Fintech & Mercado Financeiro',
      score: 94,
      stage: 'proposal',
      needsSummary: 'Aguardando detalhamento sobre isolamento multitenant, criptografia AES-256 e SLAs de resposta do agente.',
      lastContactDate: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(),
      daysWithoutContact: 5,
      priority: 'urgent',
      status: 'awaiting_followup',
    },
    {
      id: 'lead-003',
      name: 'LogTech Cargas Inteligentes',
      company: 'LogTech Cargas',
      contactPerson: 'Marcelo Duarte',
      contactRole: 'Head de Operações',
      email: 'marcelo.duarte@logtechcargas.com.br',
      phone: '+55 41 99123-4567',
      segment: 'Logística & Transportes',
      score: 82,
      stage: 'inbound',
      needsSummary: 'Lead inbound solicitou contato para automação de triagem de fretes com OCR e IA generativa.',
      lastContactDate: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
      daysWithoutContact: 2,
      priority: 'medium',
      status: 'awaiting_contact',
    },
  ];

  private drafts: Map<string, FollowupDraft> = new Map();

  async listLeadsAwaitingFollowup(): Promise<Lead[]> {
    return this.leads.filter(
      (l) => l.status === 'awaiting_contact' || l.status === 'awaiting_followup'
    );
  }

  async getLeadById(id: string): Promise<Lead | null> {
    return this.leads.find((l) => l.id === id) || null;
  }

  async saveFollowupDraft(draft: FollowupDraft): Promise<void> {
    this.drafts.set(draft.id, { ...draft });
  }

  async getDraftsByJobId(_jobId: string): Promise<FollowupDraft[]> {
    return Array.from(this.drafts.values());
  }

  async updateDraftStatus(draftId: string, status: FollowupDraft['status'], dispatchedAt?: string): Promise<void> {
    const draft = this.drafts.get(draftId);
    if (draft) {
      draft.status = status;
      if (dispatchedAt) draft.dispatchedAt = dispatchedAt;
    }
  }

  async updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<void> {
    const lead = this.leads.find((l) => l.id === leadId);
    if (lead) {
      lead.status = status;
      if (notes) lead.needsSummary += ` [Atualização: ${notes}]`;
    }
  }

  // Helper for tests/reset
  getAllDrafts(): FollowupDraft[] {
    return Array.from(this.drafts.values());
  }
}

export const defaultLeadRepository = new InMemoryLeadRepository();
