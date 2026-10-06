# Chronokairo — operação de agentes

Este repositório versiona automações, definições dos agentes e scripts de operação da empresa. Fontes canônicas: `.copilot/agents/`, `.copilot/chronokairo/configure.py`, `company-context.json` e `POLICY.md`. O runtime é `~/.copilot/chronokairo`, ligado a este checkout.

Preservar alterações simultâneas e preferências de modelos/providers. Não executar configure/install global para corrigir um único cadastro. Alterações no banco do Copilot exigem backup SQLite consistente, transação, integridade e readback no aplicativo. Não editar segredos, contas OAuth ou credenciais dos providers.

Remotes de produto devem pertencer a `chronokairo` no GitHub/GitLab. A base de sessão das automações pode ser `ck-ai`, mas Finance usa fontes reais de `gitlab.com/chronokairo/finance`. Não inferir receita de código, planos ou propostas. Workmed recebe o backlog migrado de Audiomed; preservar recibo e links de origem. Agroflow é SaaS; Sítio Fazenda Nova Canaã é tenant.

Atomic Design somente para UI; lógica de negócio hexagonal e feature-driven. Workmed usa CSS/SVG próprios, sem dependências visuais. Reutilizar features completas do tenant Audiomed.

Revisores e QA não aprovam seu próprio código. Não é obrigatório delegar: só usar subagentes quando solicitado pelo dono ou por um workflow/skill aplicável. Não fazer force-push, merge, deploy, pagamento real ou envio externo sem autorização específica da sessão. Trabalho reversível já autorizado deve continuar sem pedir confirmação repetida.

Entregas reportam evidências, testes, links e limitações. Runtime completed não significa entregue ou implantado. Relatórios e dependências ficam no Desktop/Chronokairo. Alertas históricos resolvidos permanecem auditáveis; não apagar execuções falhadas nem marcá-las como sucesso.

Verificação operacional: `python3 -m unittest discover -s .copilot/chronokairo -p 'test_operations.py'`; `python3 -m py_compile` nos scripts alterados; `git diff --check`; `node .copilot/chronokairo/verify-app.mjs` quando o app estiver disponível.
