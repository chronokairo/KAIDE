# Chronokairo — operação de agentes

## Configuração ativa — ADR 0001

Desde 2026-10-07, a equipe ativa para teste tem somente `comercial`, `security` e `payment`. Fontes ativas: `.copilot/minimal-team/team.json`, `.copilot/minimal-team/agents/` e `.copilot/minimal-team/install.py`. Agenda em America/Manaus: comercial diário 01:00, security segunda-feira 00:00, payment diário 02:00. Não reinstalar a equipe completa por `configure.py` ou `install.py`. O restante deste documento e `.copilot/chronokairo/` mantêm o histórico e convenções gerais; a decisão atual prevalece onde houver conflito.

Payment trabalha somente com oportunidades pesquisadas, carteira local/testnet e paper trading. Não executa custódia, ordens, investimento ou transferências de fundos reais. Comercial pode persistir leads no CRM por acesso autorizado e corrigir o CRM em branch/worktree própria, com testes e PR; não faz merge/deploy nem contato externo. Security registra cobertura e evidências sem explorar produção. Os três executam diretamente, sem ampliar a equipe por delegação.

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


<!-- BEGIN:chronokairo-ui-hexagonal-migration -->
## Diretriz de migração de UI e arquitetura — 2026-10-07

Decisão do proprietário: migrar os projetos para UI em Atomic Design e arquitetura hexagonal organizada por feature. O Marketing é o primeiro projeto da migração. Este registro é uma obrigação de migração, não uma declaração de que o código atual já está conforme. Esta seção prevalece sobre recomendações anteriores de Tailwind/PostCSS e de duplicação de UI.

### UI e Platform
- Produtos internos Chronokairo devem consumir o design system canônico de `@chronokairo/platform/ui` e seus tokens/estilos publicados. Atomic Design aplica-se à UI: átomos, moléculas, organismos e templates; telas compõem esses elementos sem conter regras de negócio.
- Componentes visuais genéricos ausentes devem ser implementados no Platform e consumidos pelos produtos. Não criar cópias locais divergentes de Button, Input, Card, Modal, Avatar ou outros componentes universais. Componentes específicos da feature ficam na própria feature.
- O próprio Platform deve fornecer os componentes Atomic Design com CSS nativo/CSS Modules e sem exigir Tailwind ou plugin PostCSS no consumidor. Não mascarar uma dependência movendo-a para o Platform.
- Remover completamente o uso direto de Tailwind e PostCSS: dependências próprias, plugins, configurações, diretivas CSS, utilitários como tailwind-merge e classes que dependam de geração Tailwind. Substituir os estilos antes de remover ferramentas, preservando responsividade, acessibilidade, temas e estados da UI.
- SaaS independentes, projetos de clientes e open source preservam sua autonomia e restrições de licenciamento/zero-lib: aplicar Atomic Design com CSS nativo; não introduzir dependência no pacote interno Platform onde o contrato do projeto exige código próprio. Projetos sem UI não devem adicionar frameworks ou bibliotecas visuais apenas para satisfazer esta regra.

### Hexagonal por feature
- Organizar cada feature/bounded context em domínio puro, aplicação/casos de uso, portas, adaptadores de infraestrutura e UI. Reutilizar a nomenclatura equivalente existente quando os limites forem claros; não criar camadas vazias.
- Domínio e aplicação não importam React/Next.js, Supabase/Firebase, SDKs de provedores, banco, HTTP ou storage concretos. Dependências externas são acessadas por portas e injetadas no ponto de composição.
- UI, hooks, controllers e handlers chamam casos de uso/portas de entrada; não acessam repositórios Supabase, SDKs ou tabelas diretamente. Adaptadores implementam portas de saída; tipos de domínio não dependem de tipos gerados do banco.
- Ao migrar uma feature, preservar contratos, isolamento de organização/tenant, autorização, consentimento, auditoria e comportamento existente. Não duplicar entidades nem alterar a propriedade dos domínios entre produtos.

### Execução e critérios de conclusão
- Começar pelo Marketing; migrar as demais aplicações por feature em mudanças revisáveis. Inventariar dependências, estilos, componentes duplicados e violações de direção de dependência antes de modificar a implementação.
- Não apagar alterações simultâneas nem realizar refatoração funcional de outros projetos somente por este registro. Atualizar ADR/log e backlog com escopo, pendências e evidências a cada etapa de implementação.
- Uma feature só está migrada quando usa a UI canônica aplicável, não depende de Tailwind/PostCSS próprio, respeita portas/casos de uso e passa nos testes relevantes, typecheck, build e verificação visual dos fluxos afetados. Não desabilitar verificações para declarar sucesso.
- A remoção completa deve ser comprovada em código ativo, manifests, configurações e lockfiles. Inventariar também módulos legados; arquivá-los ou migrá-los explicitamente, sem esconder ocorrências para obter uma busca vazia.
- Se o framework ainda trouxer PostCSS transitivamente ou internamente, registrar a origem e a limitação: remoção das dependências/configurações próprias não significa ausência total da ferramenta. Não adulterar internals do framework ou lockfiles para alegar 100%.
- Este AGENTS.md orienta a migração futura; não autoriza por si só deploy, envio externo ou mudanças destrutivas.
<!-- END:chronokairo-ui-hexagonal-migration -->
