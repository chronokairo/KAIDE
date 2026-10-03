import { LeadRepositoryPort } from '@/application/ports/lead-repository-port';
import { Lead, FollowupDraft } from '@/domain/commercial';
import { supabaseAdmin, PROD_ORGANIZATION_ID, PROD_USER_ID } from '@/shared/supabase';

export class SupabaseLeadRepository implements LeadRepositoryPort {
  private draftsCache: Map<string, FollowupDraft> = new Map();

  constructor(private readonly organizationId: string = PROD_ORGANIZATION_ID) {}

  async listLeadsAwaitingFollowup(): Promise<Lead[]> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('organization_id', this.organizationId)
      .order('priority_order', { ascending: true });

    if (error) {
      console.error('[SupabaseLeadRepository] Erro ao carregar leads:', error.message);
      throw new Error(`Falha ao ler leads no Supabase: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    const now = Date.now();

    return data.map((row) => {
      const updatedAt = row.updated_at ? new Date(row.updated_at).getTime() : now;
      const daysWithoutContact = Math.max(1, Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)));

      const isQualified = row.status === 'Qualificado';
      const isNovo = row.status === 'Novo';

      const status: Lead['status'] = isNovo
        ? 'awaiting_contact'
        : isQualified
        ? 'awaiting_followup'
        : 'in_dialogue';

      const priority: Lead['priority'] =
        row.tier === 'A' ? 'urgent' : row.tier === 'B' ? 'high' : 'medium';

      return {
        id: row.id,
        name: row.company || row.name,
        company: row.company || 'Empresa Parceira',
        contactPerson: row.name || 'Diretoria de Tecnologia / Operações',
        contactRole: row.name || 'Liderança Executiva',
        email: row.email,
        phone: row.phone || undefined,
        segment: row.segment || 'Enterprise B2B',
        score: row.tier === 'A' ? 95 : row.tier === 'B' ? 82 : 70,
        stage: isQualified ? 'qualification' : 'inbound',
        needsSummary:
          row.approach || row.notes || 'Automação de processos com IA e engenharia de software.',
        lastContactDate: row.updated_at || row.created_at || new Date().toISOString(),
        daysWithoutContact,
        priority,
        status,
      };
    });
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) return null;

    const now = Date.now();
    const updatedAt = data.updated_at ? new Date(data.updated_at).getTime() : now;
    const daysWithoutContact = Math.max(1, Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24)));

    return {
      id: data.id,
      name: data.company || data.name,
      company: data.company || 'Empresa Parceira',
      contactPerson: data.name || 'Diretoria Executiva',
      contactRole: data.name || 'Liderança',
      email: data.email,
      phone: data.phone || undefined,
      segment: data.segment || 'Enterprise B2B',
      score: data.tier === 'A' ? 95 : 80,
      stage: data.status === 'Qualificado' ? 'qualification' : 'inbound',
      needsSummary: data.approach || data.notes || 'Engenharia de software e agentes de IA.',
      lastContactDate: data.updated_at || data.created_at || new Date().toISOString(),
      daysWithoutContact,
      priority: data.tier === 'A' ? 'urgent' : 'high',
      status: data.status === 'Novo' ? 'awaiting_contact' : 'awaiting_followup',
    };
  }

  async saveFollowupDraft(draft: FollowupDraft): Promise<void> {
    this.draftsCache.set(draft.id, draft);

    // Registra a atividade no Supabase oficial
    try {
      await supabaseAdmin.from('crm_activities').insert({
        organization_id: this.organizationId,
        user_id: PROD_USER_ID,
        lead_id: draft.leadId,
        type: 'Email',
        summary: draft.subject,
        details: `${draft.body}\n\nCall to action: ${draft.callToAction}\nJustificativa: ${draft.rationale}`,
        due_date: new Date().toISOString(),
      });
    } catch (err) {
      console.warn('[SupabaseLeadRepository] Aviso ao registrar crm_activity:', err);
    }
  }

  async getDraftsByJobId(_jobId: string): Promise<FollowupDraft[]> {
    return Array.from(this.draftsCache.values());
  }

  async updateDraftStatus(
    draftId: string,
    status: FollowupDraft['status'],
    dispatchedAt?: string
  ): Promise<void> {
    const draft = this.draftsCache.get(draftId);
    if (draft) {
      draft.status = status;
      if (dispatchedAt) draft.dispatchedAt = dispatchedAt;
      this.draftsCache.set(draftId, draft);
    }

    if (status === 'dispatched' && draft) {
      // Registra execução de tool e log de auditoria no Supabase oficial de produção
      try {
        await supabaseAdmin.from('ai_tool_executions').insert({
          organization_id: this.organizationId,
          user_id: PROD_USER_ID,
          tool_name: 'commercial.dispatch_message',
          execution_type: 'WRITE',
          execution_status: 'Success',
          duration_ms: 120,
          created_at: new Date().toISOString(),
        });

        await supabaseAdmin.from('audit_logs').insert({
          organization_id: this.organizationId,
          user_id: PROD_USER_ID,
          action: 'COMMERCIAL_FOLLOWUP_DISPATCHED',
          target: draft.companyName,
          success: true,
          details: {
            draftId,
            leadId: draft.leadId,
            recipient: draft.recipientEmail,
            subject: draft.subject,
            dispatchedAt,
          },
        });
      } catch (err) {
        console.warn('[SupabaseLeadRepository] Falha ao gravar auditoria do dispatch:', err);
      }
    }
  }

  async updateLeadStatus(leadId: string, status: Lead['status'], notes?: string): Promise<void> {
    const dbStatus =
      status === 'in_dialogue' ? 'Em Andamento' : status === 'awaiting_followup' ? 'Qualificado' : 'Novo';

    const payload: Record<string, any> = {
      status: dbStatus,
      updated_at: new Date().toISOString(),
    };

    if (notes) {
      payload.notes = notes;
    }

    const { error } = await supabaseAdmin
      .from('leads')
      .update(payload)
      .eq('id', leadId)
      .eq('organization_id', this.organizationId);

    if (error) {
      console.warn(`[SupabaseLeadRepository] Erro ao atualizar status do lead ${leadId}:`, error.message);
    }
  }
}
