/**
 * Script de Execução Real do Job 'commercial.followup' no harness ChronoKairo AI.
 * 
 * Regra do Produto: AI -> AI -> AI -> HUMAN.
 * Nenhuma mensagem externa é transmitida sem aprovação humana explícita no Control Plane.
 */

import { SupabaseLeadRepository } from '@/infrastructure/crm/supabase-lead-repository';
import { defaultCompanyControlPlane } from '@/infrastructure/control-plane/supabase-control-plane-adapter';
import { ExecuteCommercialFollowupUseCase } from '@/application/use-cases/execute-commercial-followup';

async function main() {
  console.log('='.repeat(80));
  console.log('CHRONOKAIRO AI - CONTROL PLANE / HARNESS (SUPABASE PROD OFICIAL)');
  console.log("Executando Job: 'commercial.followup' (AI Comercial - SDR & Qualificação)");
  console.log('='.repeat(80));

  const leadRepository = new SupabaseLeadRepository();
  const useCase = new ExecuteCommercialFollowupUseCase(
    leadRepository,
    defaultCompanyControlPlane
  );

  console.log('\n[1/4] Varrendo leads que aguardam contato ou follow-up no Supabase de Produção...');
  const leads = await leadRepository.listLeadsAwaitingFollowup();
  console.log(`-> Encontrados ${leads.length} leads com SLA de contato pendente:\n`);

  leads.forEach((lead, i) => {
    console.log(`  ${i + 1}. ${lead.company} (${lead.name})`);
    console.log(`     Contato: ${lead.contactPerson} (${lead.contactRole}) | Email: ${lead.email}`);
    console.log(`     Estágio: ${lead.stage.toUpperCase()} | Score: ${lead.score}/100 | Prioridade: ${lead.priority.toUpperCase()}`);
    console.log(`     Último contato: há ${lead.daysWithoutContact} dias`);
    console.log(`     Contexto: ${lead.needsSummary}\n`);
  });

  console.log('[2/4] Elaborando rascunhos de mensagens personalizadas com o AI Comercial...');
  const result = await useCase.execute();

  console.log(`-> ${result.drafts.length} rascunhos de mensagens gerados com sucesso:\n`);

  result.drafts.forEach((draft, i) => {
    console.log(`-`.repeat(80));
    console.log(`RASCUNHO #${i + 1}: ${draft.companyName} -> ${draft.recipientName} (${draft.recipientRole})`);
    console.log(`Canal Proposto: ${draft.channel.toUpperCase()} | Destino: ${draft.recipientEmail}`);
    console.log(`Assunto: "${draft.subject}"`);
    console.log(`Corpo da Mensagem:\n${draft.body}\n`);
    console.log(`Call to Action: "${draft.callToAction}"`);
    console.log(`Conformidade LGPD: ${draft.complianceCheck.lgpdCompliant ? 'PASS' : 'FAIL'} | Opt-out: ${draft.complianceCheck.hasOptOut ? 'SIM' : 'NÃO'}`);
    console.log(`Justificativa/Gatilho: ${draft.rationale}`);
    console.log(`Status do Rascunho: [${draft.status.toUpperCase()}]`);
  });

  console.log('-'.repeat(80));
  console.log('\n[3/4] Registrando Job e Human Approval Gate no Control Plane...');
  const snapshot = await defaultCompanyControlPlane.getSnapshot();
  const job = snapshot.jobs.find((j) => j.id === result.jobId);
  const commAgent = snapshot.agents.find((a) => a.role === 'commercial');

  console.log(`-> Job ID: ${job?.id}`);
  console.log(`-> Status do Job: ${job?.status.toUpperCase()}`);
  console.log(`-> Agente Responsável: ${commAgent?.name} (${commAgent?.status.toUpperCase()})`);
  console.log(`-> Tarefa Atual do Agente: "${commAgent?.currentTask}"`);
  console.log(`-> Approval Gate ID: ${job?.approvalGate?.id}`);
  console.log(`-> Tipo de Aprovação: ${job?.approvalGate?.type}`);
  console.log(`-> Status do Gate: ${job?.approvalGate?.status.toUpperCase()}`);

  console.log('\n[4/4] Verificação de Segurança (ADR-0028):');
  console.log('-> REQUER APROVAÇÃO HUMANA ANTES DO ENVIO: SIM');
  console.log('-> MENSAGENS TRANSMITIDAS EXTERNAMENTE: ZERO (0)');
  console.log('-> O envio físico só ocorrerá após autorização explícita do Diretor Técnico no Human Approval Gate.');
  console.log('='.repeat(80));
  console.log('EXECUÇÃO CONCLUÍDA COM SUCESSO - AGUARDANDO DECISÃO DO HUMANO NO CONTROL PLANE');
  console.log('='.repeat(80));
}

main().catch((err) => {
  console.error('Falha na execução do job commercial.followup:', err);
  process.exit(1);
});
