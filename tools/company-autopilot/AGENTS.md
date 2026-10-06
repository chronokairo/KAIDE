# Chronokairo — operação de agentes

Este repositório versiona automações, definições dos agentes e scripts de operação da empresa. Fontes canônicas: `.copilot/agents/`, `.copilot/chronokairo/configure.py`, `company-context.json` e `POLICY.md`. O runtime é `~/.copilot/chronokairo`, ligado a este checkout.

Preservar alterações simultâneas e preferências de modelos/providers. Não executar configure/install global para corrigir um único cadastro. Alterações no banco do Copilot exigem backup SQLite consistente, transação, integridade e readback no aplicativo. Não editar segredos, contas OAuth ou credenciais dos providers.

Remotes de produto devem pertencer a `chronokairo` no GitHub/GitLab. A base de sessão das automações pode ser `ck-ai`, mas Finance usa fontes reais de `gitlab.com/chronokairo/finance`. Não inferir receita de código, planos ou propostas. Workmed recebe o backlog migrado de Audiomed; preservar recibo e links de origem. Agroflow é SaaS; Sítio Fazenda Nova Canaã é tenant.

Atomic Design somente para UI; lógica de negócio hexagonal e feature-driven. Workmed usa CSS/SVG próprios, sem dependências visuais. Reutilizar features completas do tenant Audiomed.

Revisores e QA não aprovam seu próprio código. Não é obrigatório delegar: só usar subagentes quando solicitado pelo dono ou por um workflow/skill aplicável. Não fazer force-push, merge, deploy, pagamento real ou envio externo sem autorização específica da sessão. Trabalho reversível já autorizado deve continuar sem pedir confirmação repetida.

Entregas reportam evidências, testes, links e limitações. Runtime completed não significa entregue ou implantado. Relatórios e dependências ficam no Desktop/Chronokairo. Alertas históricos resolvidos permanecem auditáveis; não apagar execuções falhadas nem marcá-las como sucesso.

Verificação operacional: `python3 -m unittest discover -s .copilot/chronokairo -p 'test_operations.py'`; `python3 -m py_compile` nos scripts alterados; `git diff --check`; `node .copilot/chronokairo/verify-app.mjs` quando o app estiver disponível.

Preferência do dono (2026-10-06): coordenadores encaminham tarefas mecânicas delimitadas para agy ou opencode via ACP pelo runner `.copilot/chronokairo/acp.py`, seguindo POLICY.md. Workers solicitam esse encaminhamento ao coordenador, sem delegação recursiva. Exigir escopo, critérios de aceite e verificação do resultado, preservar permissões do papel e o prazo total do workflow.

Sistemas proprietários: a Chronokairo opera com seus próprios produtos (mapa em `.copilot/chronokairo/company-context.json` → `systems`). Não introduzir nem registrar como em uso SaaS de terceiros para funções da empresa (HubSpot, Notion, Zendesk, Slack, Calendly etc.); lacunas viram feature no produto próprio ou em `@chronokairo/platform`. Terceiros apenas como infraestrutura (GitHub/GitLab, Cloudflare, Supabase, Resend no Mail, modelos, gateways via payments) ou obrigação externa (fiscal, banco, contador), com aprovação do dono.

Código compartilhado: produtos internos usam `@chronokairo/platform` (lacunas são implementadas na platform, nunca duplicadas no produto); SaaS (Workmed, Agroflow) e projetos de clientes (Audiomed) são independentes, com código próprio.
