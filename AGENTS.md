# ChronoKairo AI — regras do produto

## Responsabilidade

Este repositório implementa a **empresa virtual de agentes** da ChronoKairo (software engineering company AI-first, com supervisão humana), o chat de IA da plataforma e sua API de backend. Ele não é apenas uma demonstração de RAG nem um frontend isolado. Ver [ADR-0028](docs/adr/0028-empresa-virtual-de-agentes-control-plane.md).

Modelo operacional: **AI → AI → AI → HUMAN**, nunca AI → produção. Todo trabalho segue `plan → execute → verify → evidence → approval → merge/deploy`. O humano (sócio/CTO) é orquestrador e aprovador; dinheiro real e produção exigem aprovação humana.

O produto deve:

- operar um **Control Plane** (cliente → demanda → projeto → tasks → agentes → tools → evidências → aprovação → entrega), registrando cada execução como `Job` (contexto, agente, prompt, tools usadas, alterações, testes, evidências, custo, duração, status);
- executar papéis por agentes especializados: Comercial, Analista, Product, Coder, QA, DevOps, Support e Finance/Ops;
- responder consultas usando dados e contratos dos produtos ChronoKairo;
- propor e executar manipulações no backend somente por ferramentas tipadas e autorizadas;
- expor chat, streaming, histórico, catálogo de ferramentas e auditoria por API;
- manter provedores de LLM, RAG e integrações externas atrás de portas e adapters;
- consumir a identidade, organização, tenant e RBAC da Platform.

## Arquitetura obrigatória (Hexagonal Pura)

Usar arquitetura hexagonal pura (Ports & Adapters):

```text
Adapters Primários (UI: 4 partes / HTTP API / CLI)
             │
             ▼
   Application Use Cases ──► Domain (puro)
             │
             ▼
   Application Ports (Contratos)
             │
             ▼
Adapters Secundários (HTTP fetch, Tauri IPC, Supabase, LLMs, Storage)
```

- **Camadas estritas**:
  - `src/domain/` — entidades, regras e tipos puros (sem React, Next, Express, Supabase ou SDKs).
  - `src/application/ports/` — contratos de entrada e saída.
  - `src/application/use-cases/` — orquestração de casos de uso dependendo apenas de portas.
  - `src/infrastructure/` — adapters concretos fora do hexágono:
    - `src/infrastructure/ui/` — **Adapter Primário de Apresentação**: cena **Three.js** de acompanhamento dos agentes (somente leitura, com gate de aprovação humana), orquestrada pelo `AppShell`.
    - `src/infrastructure/http/` — adapters de rede web e rotas Next.js.
    - `src/infrastructure/tauri/` — adapters nativos de desktop para IPC com o núcleo Rust `ckc`.
    - `src/infrastructure/llm/`, `identity/`, `credentials/`, `secrets/`, `audit/`.

### Política de Migração de Legados
- **Migração progressiva / sob demanda**: Arquivos legados existentes (`src/modules/*`, `src/server/rag/*`) serão migrados para a estrutura hexagonal pura conforme for necessário mexer neles. Não fazer reescritas cegas sem necessidade.
- **Roteiro de execução**: Primeiro migrar e consolidar no Next.js (Web); em seguida, conectar o desktop Tauri ao núcleo `ckc`.
- Consultas e comandos usam contratos versionados. Não acessar diretamente o banco de outro produto.
- Toda ferramenta de escrita exige autenticação, `organizationId` validado no servidor, permissão específica, validação de entrada, idempotência e auditoria.
- Ações destrutivas, financeiras, administrativas ou irreversíveis exigem confirmação explícita antes da execução.
- O modelo nunca escolhe nem amplia permissões; a autorização ocorre no backend depois da chamada da ferramenta.
- Segredos e credenciais de provedores ficam somente no backend.

## UI e experiência (Three.js de acompanhamento)

A interface é um adapter primário (`src/infrastructure/ui/`) **somente de acompanhamento**: uma cena **Three.js** que mostra a empresa virtual de agentes em operação (agentes, jobs em andamento, handoffs entre papéis, status, custo, evidências e pedidos de aprovação). Ela observa e apresenta; a execução acontece no Control Plane e nos agentes, nunca na cena.

- A cena consome o event log e os casos de uso do Control Plane por hooks/portas. Ela é leitura por padrão; a única ação permitida é aprovar ou rejeitar (gate humano) pelos casos de uso de aprovação.
- O adapter Three.js fica em `src/infrastructure/ui/` e não importa domínio impuro nem faz `fetch()`/`invoke()` direto.
- Substitui as 4 partes canônicas (`AppBar`, `LeftSidebar`, `Body`, `RightSidebar`). Os componentes legados continuam em uso até a migração (política de migração progressiva abaixo).

- Zero `fetch()` ou `invoke()` acoplados dentro de componentes JSX da UI: a UI consome casos de uso ou portas via hooks.
- Remover branding e padrões visuais legados de Athena/TOTVS.
- Não duplicar componentes compartilhados localmente. Quando `@chronokairo/platform/ui` ainda não oferecer um componente, criar uma porta visual local e planejar sua promoção ao pacote compartilhado.

## Organização do monorepo

Este repositório consolida `desktop`, `ai` e as ferramentas de desenvolvimento do `thinkcoffee`:

- **`src-tauri/shell`** — casca Tauri fina. Consome o crate `ckc` (binário `ck`) por git dependency do repo **`chronokairo/cli`** (tag `v0.1.0`) e o harness de OSINT local (`src-tauri/intelligence`).
- **`src-tauri/intelligence`** — crate `chronokairo-intelligence` (OSINT & Due Diligence Harness).
- **`src/`** — frontend Next.js (React 19), subsistema RAG (UI em `src/modules/rag`; backend em Next API routes `src/app/api/*` sobre o núcleo `src/server/rag`) e suíte de controle de inteligência herdada do `thinkcoffee` (`src/modules/ai/components/`: Agentes, Skills, Memória, Sessões, Prompts, Hooks, Patches).
- **Núcleo Rust zero-lib**: **não** está neste repositório. Vive em [`chronokairo/cli`](https://gitlab.com/chronokairo/cli) (`ckc::agent`, `ckc::llm`, `ckc::mcp`, `ckc::tools`, `ckc::repo`, ...) — ver [ADR-0027](docs/adr/0027-extracao-core-ckc-para-repo-cli.md). Mudança no agente, nas tools, no runtime de LLM ou nos testes `p0_*` pertence ao repo `cli`, não a este.
- Histórico dos repos originais preservado nas branches `cli` e `desktop`.

## Critérios mínimos

- `GET /health`, `GET /ready` e `GET /version`.
- Testes unitários dos casos de uso e políticas de autorização.
- Testes de integração para consulta, escrita autorizada, negação por tenant/RBAC e idempotência.
- Lint, typecheck, testes e build executados via **npm**.
- Nenhuma resposta mockada em caminhos de produção.

## Débitos técnicos abertos (ver docs/adr/0005)

- Concluir a migração da UI para `@chronokairo/platform/ui` (shell/navegação ainda locais; `/rag` já migrado com `ThemeProvider`/`ThemeToggle`/`Button` e tokens themáveis dark/light).
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
| [0023](docs/adr/0023-tui-edit-ux-gpu-detection-e-workspace-context.md) | Paridade de UX/UI com microsoft/edit, GPU via SMI e contexto de workspace no agente |
| [0024](docs/adr/0024-roadmap-p0-mercado-validacao-e-implementacao.md) | Roadmap de paridade com o mercado: P0s validados com testes de integração e os 3 P0s restantes implementados |
| [0025](docs/adr/0025-ckc-modo-edit-aider-para-llms-pequenos.md) | Modo edit (aider-like) no `ckc` CLI para LLMs pequenos: editar/autocompletar apenas o arquivo aberto |
| [0026](docs/adr/0026-debito-implementacao-p1s-mercado.md) | Débito: implementação dos 15 P1s de mercado com testes e validação via NVIDIA NIM |
| [0027](docs/adr/0027-extracao-core-ckc-para-repo-cli.md) | Extração do núcleo `ckc` para o repo próprio `chronokairo/cli` |
| [0028](docs/adr/0028-empresa-virtual-de-agentes-control-plane.md) | Empresa virtual de agentes (AI-first): Control Plane, evidência e aprovação, UI Three.js de acompanhamento |
| [0029](docs/adr/0029-implementacao-ui-threejs-e-automacoes-copilot.md) | Implementação da UI Three.js da Empresa Virtual e Automações do Copilot |
| [0030](docs/adr/0030-ui-2d-threejs-pantone-2026-cloud-dancer-e-8bit-color.md) | Interface 2D em Three.js com Pantone 2026 White (Cloud Dancer) e Estética 8-Bit Colorida |
| [0031](docs/adr/0031-estilo-pokemon-2d-3d-e-interface-minimalista.md) | Estilo Pokémon 2D/3D em Three.js e Interface Minimalista |

### Mapas de código — `docs/maps/`

| Mapa | Conteúdo |
| --- | --- |
| [ckc-agent-tools-api.md](docs/maps/ckc-agent-tools-api.md) | APIs públicas do núcleo `ckc`: agente (loop, hooks, subagentes, estado, registry), tools (fs, shell, patch, git, sandbox, exec_policy, background, picker) e repo (contexto, AGENTS.md, scanner) |
| [ckc-llm-server-api.md](docs/maps/ckc-llm-server-api.md) | APIs do núcleo `ckc`: LLM (client/streaming, router, provider_chain, prompts), providers (catálogo, store), MCP, memória, skills, compressor, protocolo (Op/EventMsg/event log) e app-server headless |
| [frontend-dev-harness-ui.md](docs/maps/frontend-dev-harness-ui.md) | UI do dev harness: navegação (NAV_GROUPS), runtime do agente no frontend (transport, agentClient, hooks, tipos), componentes, casca Tauri atual e receita para a task supervision |

### TODOs

- [`TODO.md`](TODO.md) — débitos técnicos e melhorias do backend RAG (segurança, performance, arquitetura, testes, DevOps).
- [`chronokairo/cli` → `TODO.md`](https://gitlab.com/chronokairo/cli/-/blob/main/TODO.md) — pendências do núcleo Rust `ckc` / binário `ck` (repo próprio, ver [ADR-0027](docs/adr/0027-extracao-core-ckc-para-repo-cli.md)).
- [`docs/market/TODO.md`](docs/market/TODO.md) — paridade com coding agents de mercado (CLI e desktop), derivada dos changelogs em `docs/market/changelogs/`.
- [`tools/`](tools/) — TODOs locais das ferramentas absorvidas (cki-lite, browser-mcp-lite, research-rag, sandbox).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
