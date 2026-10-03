# ADR-0036 - Conexão Oficial ao Supabase de Produção, Eliminação de Mocks e Persistência Real do Control Plane

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

Conforme diretriz inegociável da ChronoKairo AI expressa em `AGENTS.md` ("*Nenhuma resposta mockada em caminhos de produção*") e demanda explícita do usuário:
> "esses fake e mock remova, só dados do supabase prod oficial"
> "vc ta fazendo mock inves de implementar banco"

O harness e o Control Plane não devem depender de dados sintéticos ou stubs em memória. O sistema deve estar conectado diretamente ao banco de dados PostgreSQL oficial de produção no Supabase (`chronokairo-prod`, ref `eufyppwpnxmxeinabwyi`), lendo entidades reais da empresa e persistindo transações, execuções de ferramentas e logs de auditoria no banco.

## Decisões

### 1. Ativação e Restauração do Banco Oficial
- O projeto `chronokairo-prod` (`eufyppwpnxmxeinabwyi`) no datacenter AWS São Paulo (`sa-east-1`) foi restaurado do estado pausado via CLI e Management API e encontra-se com status `ACTIVE_HEALTHY`.
- O cliente Supabase (`src/shared/supabase.ts`) foi migrado do stub mock (`mockSupabaseQuery`) para o SDK oficial `@supabase/supabase-js`, expondo clientes tipados com chaves `anon` e `service_role` e isolando o `PROD_ORGANIZATION_ID` (`e0f6b749-d7b9-5ea8-9b80-c1d919bf7aaf`) e o `PROD_USER_ID` (`50e35fa5-3bbb-4769-ac0d-b8d13738056b` - Luan Nery / Tech Lead).

### 2. Implementação do Adaptador de Banco do Control Plane (`SupabaseCompanyControlPlaneAdapter`)
- Localizado em `src/infrastructure/control-plane/supabase-control-plane-adapter.ts`.
- **Leitura Real:**
  - Carrega os 12 colaboradores reais da ChronoKairo da tabela `employees` (Luan Nery, Riad Makarem, Adrielly Souza, Carlos Ruan, ChronoKairo Dev Core, Erick Silva, etc.).
  - Carrega as tarefas de projetos reais da tabela `project_tasks` (incluindo `AUDIO-ASO-01` de Audiomed e `SECP-01` a `SECP-07` de SecProvas).
  - Consulta contagem de execuções em `ai_tool_executions` e eventos de auditoria em `audit_logs` para telemetria real.
- **Escrita Real:**
  - Registra a submissão de cada job na tabela `ai_tool_executions` e `audit_logs`.
  - Registra aprovações humanas (`approveJob`) como eventos `HUMAN_GATE_APPROVAL` em `audit_logs` com autorizador auditável (Luan Nery / Riad Makarem).
  - Registra rejeições humanas (`rejectJob`) como eventos `HUMAN_GATE_REJECTED` em `audit_logs`.

### 3. Implementação do Repositório de CRM Oficial (`SupabaseLeadRepository`)
- Localizado em `src/infrastructure/crm/supabase-lead-repository.ts`.
- Lê os 13 leads reais da tabela `leads` da organização ChronoKairo:
  - Nortesul Logística e Transportes Especializados
  - Contato Serviços de Conservação e Manutenção
  - Manaus Brasil Logística e Transporte
  - Faculdade do Amazonas — FAM
  - Porto Chibatão
  - Samel Serviços de Assistência Médico Hospitalar
  - Sociedade Fogás Ltda.
  - Atem's Distribuidora de Petróleo S.A.
  - Importadora TV Lar S.A.
  - Bemol S/A
  - Samel Plano de Saúde
- Grava os rascunhos de follow-up diretamente na tabela `crm_activities` com `type: 'Email'`, `user_id: PROD_USER_ID` e `due_date`.
- Atualiza status dos leads diretamente na tabela `leads` no banco de dados.

### 4. Integração do QA e Auditoria Adversarial
- Localizado em `src/application/use-cases/execute-qa-pr-review.ts`.
- Registra cada execução de auditoria adversarial e veredito PASS/FAIL em `ai_tool_executions` e `audit_logs` no Supabase prod oficial.

### 5. Apresentação na UI Three.js (`CompanyMonitor.tsx`)
- Indicador oficial no HUD: `CHRONOKAIRO AI | Supabase Prod Oficial (chronokairo-prod)`.
- Apresentação de agentes, jobs e evidências sincronizados em tempo real com o banco de dados.

## Consequências

- Eliminação definitiva de mocks, fakes e dados fictícios nos caminhos de produção.
- Todas as operações comerciais e de QA geram registros reais e auditáveis no PostgreSQL do Supabase (`audit_logs`, `ai_tool_executions`, `crm_activities`, `leads`, `project_tasks`).
- Suíte completa de testes (19/19 testes) validada e aderente à estrutura de dados oficial.
- Typecheck (`tsc --noEmit`) 100% verde sem erros.
