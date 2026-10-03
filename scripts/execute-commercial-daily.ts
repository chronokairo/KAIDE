/**
 * Script de Execução Real do Job 'commercial.daily' no harness ChronoKairo AI.
 * 
 * 1. Lê os 13 leads qualificados no Supabase oficial de produção (`leads`).
 * 2. Realiza análise corporativa de due diligence por empresa (setor, desafio, pitch).
 * 3. Atualiza os registros do CRM com as estratégias calculadas.
 * 4. Compõe rascunhos de abordagem consultiva de alto valor.
 * 5. Abre um Human Approval Gate (`outbound_contact`) no Control Plane aguardando o Diretor Técnico.
 */

import { SupabaseLeadRepository } from '@/infrastructure/crm/supabase-lead-repository';
import { defaultCompanyControlPlane } from '@/infrastructure/control-plane/supabase-control-plane-adapter';
import { ExecuteCommercialDailyUseCase } from '@/application/use-cases/execute-commercial-daily';

async function main() {
  console.log('='.repeat(80));
  console.log('CHRONOKAIRO AI - CONTROL PLANE / HARNESS (SUPABASE PROD OFICIAL)');
  console.log("Executando Job: 'commercial.daily' (AI Comercial - Análise de Leads & CRM)");
  console.log('='.repeat(80));

  const leadRepo = new SupabaseLeadRepository();
  const useCase = new ExecuteCommercialDailyUseCase(leadRepo, defaultCompanyControlPlane);

  console.log('\n[1/4] Varrendo leads corporativos qualificados no Supabase de Produção...');
  const result = await useCase.execute();

  console.log(`-> Concluído: ${result.leadsScannedCount} leads analisados e processados.\n`);

  console.log('[2/4] Análise Corporativa e Ângulos de Abordagem Personalizados:');
  result.analyses.forEach((a, i) => {
    console.log(`  ${i + 1}. [Tier ${a.tier}] ${a.company} (${a.segment} - ${a.location})`);
    console.log(`     Desafio Principal: ${a.keyChallenge}`);
    console.log(`     Ângulo de Solução: ${a.solutionAngle}`);
    console.log(`     Pitch Recomendado: ${a.recommendedPitch}\n`);
  });

  console.log('[3/4] Rascunhos de Contato Consultivo Gerados (em Gate de Aprovação):');
  result.drafts.forEach((d, i) => {
    console.log(`  Draft #${i + 1} -> Destinatário: ${d.recipientEmail} (${d.companyName})`);
    console.log(`  Assunto: "${d.subject}"`);
    console.log(`  Status: [${d.status.toUpperCase()}] | LGPD Compliant: ${d.complianceCheck.lgpdCompliant ? 'SIM' : 'NÃO'}\n`);
  });

  console.log('='.repeat(80));
  console.log('[4/4] Verificação de Governança (ADR-0028: AI → AI → AI → HUMAN):');
  console.log(`-> Job ID: ${result.jobId}`);
  console.log(`-> Approval Gate ID: ${result.approvalGateId}`);
  console.log('-> Status: AGUARDANDO APROVAÇÃO HUMANA (waiting_approval)');
  console.log('-> Política de Disparo: NENHUMA mensagem externa foi transmitida.');
  console.log('-> Os emails só serão despachados via Resend SDK após autorização formal do Diretor Técnico.');
  console.log('='.repeat(80));
  console.log("JOB 'commercial.daily' EXECUTADO E PERSISTIDO COM SUCESSO NO CONTROL PLANE");
  console.log('='.repeat(80));
}

main().catch((err) => {
  console.error('Falha na execução do job commercial.daily:', err);
  process.exit(1);
});
