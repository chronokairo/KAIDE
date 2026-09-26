# ChronoKairo AI — regras do produto

## Responsabilidade

Este repositório implementa o chat de IA da plataforma ChronoKairo e sua API de backend. Ele não é apenas uma demonstração de RAG nem um frontend isolado.

O produto deve:

- responder consultas usando dados e contratos dos produtos ChronoKairo;
- propor e executar manipulações no backend somente por ferramentas tipadas e autorizadas;
- expor chat, streaming, histórico, catálogo de ferramentas e auditoria por API;
- manter provedores de LLM, RAG e integrações externas atrás de portas e adapters;
- consumir a identidade, organização, tenant e RBAC da Platform.

## Arquitetura obrigatória

Usar arquitetura hexagonal:

```text
HTTP/SSE/MCP adapters -> application use cases -> domain -> output ports -> infrastructure adapters
```

- O domínio e os casos de uso não importam Express, Supabase, SDK de LLM ou clientes dos produtos.
- Consultas e comandos usam contratos versionados. Não acessar diretamente o banco de outro produto.
- Toda ferramenta de escrita exige autenticação, `organizationId` validado no servidor, permissão específica, validação de entrada, idempotência e auditoria.
- Ações destrutivas, financeiras, administrativas ou irreversíveis exigem confirmação explícita antes da execução.
- O modelo nunca escolhe nem amplia permissões; a autorização ocorre no backend depois da chamada da ferramenta.
- Segredos e credenciais de provedores ficam somente no backend.

## UI e experiência

- Refatorar a interface para o design system padrão ChronoKairo (`@chronokairo/platform/ui`) e seus tokens de tema.
- Reutilizar AppBar, navegação, identidade autenticada, ícones, estados de carregamento, feedback e componentes acessíveis da plataforma.
- O tema claro/escuro deve aparecer apenas como ícone na AppBar; não duplicar controles na sidebar.
- O chat é a experiência principal. Busca, fontes, ferramentas executadas, confirmações e resultados devem ser distinguíveis e rastreáveis.
- Remover branding e padrões visuais legados de Athena/TOTVS quando não forem necessários ao domínio da integração.
- Não duplicar componentes compartilhados localmente. Quando `@chronokairo/platform/ui` ainda não oferecer um componente, criar uma porta visual local e planejar sua promoção ao pacote compartilhado.

## Organização do monorepo

Este repositório consolida `cli`, `desktop`, `ai` e as ferramentas de desenvolvimento do `thinkcoffee`:

- **`src-tauri/core`** — núcleo Rust **zero-lib** (crate `ckc`), fonte de verdade da lógica do agente nativo e execução de ferramentas.
- **`src-tauri/shell`** — casca Tauri fina que consome o `ckc` para execução desktop nativa.
- **`src/`** — frontend Next.js (React 19), subsistema RAG (`src/modules/rag`) e suíte de controle de inteligência herdada do `thinkcoffee` (`src/modules/ai/components/`: Agentes, Skills, Memória, Sessões, Prompts, Hooks, Patches).
- Histórico dos repos originais preservado nas branches `cli` e `desktop`.

## Critérios mínimos

- `GET /health`, `GET /ready` e `GET /version`.
- Testes unitários dos casos de uso e políticas de autorização.
- Testes de integração para consulta, escrita autorizada, negação por tenant/RBAC e idempotência.
- Lint, typecheck, testes e build executados via **npm**.
- Nenhuma resposta mockada em caminhos de produção.

## Débitos técnicos abertos (ver docs/adr/0005)

- Portar o backend Express do RAG (`src/server/rag`) para Next API routes (hoje excluído do typecheck).
- Concluir a migração da UI para `@chronokairo/platform/ui` (shell/navegação ainda locais).
- Conectar os comandos Tauri ao núcleo `ckc` (wiring incremental).

## Índice de documentação

### ADRs — `docs/adr/`

| ADR | Decisão |
| --- | --- |
| [0001](docs/adr/0001-unificacao-monorepo-ai.md) | Unificação do monorepo `ai` (núcleo zero-lib `ckc` + casca Tauri + Next) |
| [0002](docs/adr/0002-centralizacao-ia-no-ai.md) | Centralização da IA do ecossistema no `chronokairo/ai` |
| [0003](docs/adr/0003-centralizacao-telas-ia-data.md) | Centralização das telas de IA do app data no `chronokairo/ai` |
| [0004](docs/adr/0004-rename-package-chronokairo-ai.md) | Renomear pacote `chronokairo-desktop` → `@chronokairo/ai` |
| [0005](docs/adr/0005-debitos-tecnicos-pos-centralizacao.md) | Débitos técnicos pós-centralização |
| [0006](docs/adr/0006-rapunzel-chat-conteudo.md) | Rapunzel — chat de criação de conteúdo (subpath `./rapunzel`) |
| [0007](docs/adr/0007-absorcao-governanca-thinkcoffee.md) | Absorção dos ativos de governança e segurança do ThinkCoffee |
| [0008](docs/adr/0008-absorcao-osint-intelligence-harness.md) | Absorção do harness de OSINT, due diligence e web search |
| [0009](docs/adr/0009-absorcao-tool-calling-kairos-harness.md) | Absorção do ToolSectorHarness e motor de agentes Kairos |
| [0010](docs/adr/0010-absorcao-sala-e-core-capacidades-ia.md) | Absorção dos módulos Sala e Core (multiagente, MCP, agent planner) |
| [0011](docs/adr/0011-consolidacao-kairos-dev-coding-agent.md) | Consolidação do Kairos-Dev (coding agent & prompts) |
| [0012](docs/adr/0012-absorcao-athena-rag-unificado.md) | Absorção do Athena (RAG unificado e ecossistema legado) |
| [0013](docs/adr/0013-absorcao-rag-mcp-e-ranking-research.md) | Absorção dos módulos de IA do Research (RAG/MCP, NVIDIA LLM Ranking) |
| [0014](docs/adr/0014-absorcao-clamp-tool-calling-slm.md) | Absorção do Clamp (tool calling e confiabilidade para SLMs) |
| [0015](docs/adr/0015-absorcao-anamnesic-bridges-ide.md) | Absorção do Anamnesic Bridges (VS Code/Antigravity → Ollama API) |
| [0016](docs/adr/0016-absorcao-sandbox-aegisos.md) | Absorção do AegisOS/Sandbox (execução segura em containers) |
| [0017](docs/adr/0017-absorcao-anamnesic-context-memory-mcp.md) | Absorção do Anamnesic Context (memória de agentes e MCP server) |
| [0018](docs/adr/0018-absorcao-agent-dashboard-governance.md) | Absorção do Agent Control Center/Dashboard (governança & runtime) |
| [0019](docs/adr/0019-absorcao-cki-lite-terminal-agent-e-winforms.md) | Absorção do CKI-Lite (terminal agent NVIDIA NIM + client WinForms) |
| [0020](docs/adr/0020-remocao-por-traineddata-vestigial.md) | Remoção do `por.traineddata` vestigial em `src/modules/ocr` |
| [0021](docs/adr/0021-absorcao-ia-projetos-crm-e-satelites.md) | Absorção das capacidades de IA satélites (projects, crm, bi, marketing, legal, ...) |
| [0022](docs/adr/0022-migracao-hexagonal-sem-delecao.md) | Migração para arquitetura hexagonal sem deleção de código |

### TODOs

- [`TODO.md`](TODO.md) — débitos técnicos e melhorias do backend RAG (segurança, performance, arquitetura, testes, DevOps).
- [`src-tauri/core/TODO.md`](src-tauri/core/TODO.md) — pendências do núcleo Rust `ckc`.
- [`tools/`](tools/) — TODOs locais das ferramentas absorvidas (cki-lite, browser-mcp-lite, research-rag, sandbox).
