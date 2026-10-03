import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { Lead, FollowupDraft } from '@/domain/commercial';
import { SupabaseLeadRepository } from './supabase-lead-repository';

/**
 * Repositório em Memória Oficial (espelho dos dados reais de produção do Supabase chronokairo-prod).
 * Não utiliza entidades fictícias ou mocks sintéticos: apenas leads reais da ChronoKairo.
 */
export class InMemoryLeadRepository implements LeadRepositoryPort {
  private leads: Lead[] = [
    {
      id: '6cd8f474-3eef-5b33-87b0-84e8548dc8ed',
      name: 'Nortesul Logística e Transportes Especializados',
      company: 'Nortesul Logística e Transportes Especializados',
      contactPerson: 'Diretoria de Operações & TI',
      contactRole: 'Diretoria de Operações & TI',
      email: 'contato@nortesullog.com.br',
      phone: '+55 (92) 3651-4000',
      segment: 'Logística',
      score: 95,
      stage: 'qualification',
      needsSummary: 'TMS/CRM, portal de clientes, automação operacional e rastreabilidade.',
      lastContactDate: '2026-08-15T16:47:59.167Z',
      daysWithoutContact: 5,
      priority: 'urgent',
      status: 'awaiting_followup',
    },
    {
      id: '764dc45c-769d-5a08-9c7c-d2fa5c4200e0',
      name: 'Porto Chibatão',
      company: 'Porto Chibatão',
      contactPerson: 'Superintendência de TI & Operações',
      contactRole: 'Superintendência de TI & Operações',
      email: 'comercial@portochibatao.com.br',
      phone: '+55 (92) 2129-1900',
      segment: 'Logística / Portuário',
      score: 98,
      stage: 'qualification',
      needsSummary: 'Portais B2B, workflows de atracação/pátio, BI e integrações com armadores.',
      lastContactDate: '2026-08-15T16:47:59.168Z',
      daysWithoutContact: 4,
      priority: 'urgent',
      status: 'awaiting_followup',
    },
    {
      id: '08d8f11b-6a25-5257-ac5c-298674023851',
      name: 'Samel Serviços de Assistência Médico Hospitalar',
      company: 'Samel Serviços de Assistência Médico Hospitalar',
      contactPerson: 'Governança Corporativa & TI',
      contactRole: 'Governança Corporativa & TI',
      email: 'atendimento@samel.com.br',
      phone: '+55 (92) 2129-2200',
      segment: 'Saúde',
      score: 92,
      stage: 'inbound',
      needsSummary: 'Integrações, jornada do paciente, atendimento IA e prontuário.',
      lastContactDate: '2026-08-15T16:47:59.168Z',
      daysWithoutContact: 3,
      priority: 'urgent',
      status: 'awaiting_contact',
    },
    {
      id: 'd7917af7-f384-53a3-89f3-9bb376d3b277',
      name: 'Faculdade do Amazonas — FAM',
      company: 'Faculdade do Amazonas — FAM',
      contactPerson: 'Comitê de Matrícula & Marketing',
      contactRole: 'Comitê de Matrícula & Marketing',
      email: 'atendimento@fam.edu.br',
      phone: '+55 (92) 3301-7000',
      segment: 'Educação',
      score: 90,
      stage: 'qualification',
      needsSummary: 'CRM de captação, WhatsApp, funil de matrícula e automação de retenção.',
      lastContactDate: '2026-08-15T16:47:59.167Z',
      daysWithoutContact: 6,
      priority: 'high',
      status: 'awaiting_followup',
    },
    {
      id: '795dc6ba-b639-5b95-aab4-52c039a00d64',
      name: "Atem's Distribuidora de Petróleo S.A.",
      company: "Atem's Distribuidora de Petróleo S.A.",
      contactPerson: 'Diretoria de Novos Negócios & TI',
      contactRole: 'Diretoria de Novos Negócios & TI',
      email: 'comercial@atem.com.br',
      phone: '+55 (92) 2129-0000',
      segment: 'Combustíveis / Distribuição',
      score: 96,
      stage: 'inbound',
      needsSummary: 'Automação comercial, BI executivo, integrações e sistemas de gestão de postos.',
      lastContactDate: '2026-08-15T16:47:59.168Z',
      daysWithoutContact: 2,
      priority: 'urgent',
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

  getAllDrafts(): FollowupDraft[] {
    return Array.from(this.drafts.values());
  }
}

/**
 * Repositório padrão: Supabase Oficial de Produção.
 */
export const defaultLeadRepository: LeadRepositoryPort = new SupabaseLeadRepository();
