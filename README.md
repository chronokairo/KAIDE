# Kaide (ex-Kaide)

![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat&logo=tauri&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

Kaide = Kairos Code + AI + IDE. Monorepo no layout de `openai/codex` (ver ADR-0042): `apps/web` (Next.js 16 / React 19 + RAG + Control Plane), `apps/desktop` (Tauri 2), `kaide-rs/` (workspace Rust: `core` zero-lib `kaide` / binário `kaide`, `shell`, `intelligence`), `sdk/typescript` (wrapper do binário) e as ferramentas de IA absorvidas do ecossistema.

Consolidação dos antigos `cli`, `desktop` e `ai` — histórico preservado nas branches `cli` e `desktop`.

## ✨ Funcionalidades

### Chat & Agentes de IA (experiência principal)
- Chat com **streaming SSE** (`/api/ai/chat`) sobre arquitetura hexagonal (`apps/web/src/domain` → `apps/web/src/application` → `apps/web/src/infrastructure`).
- Chats especializados **Froia** e **Rapunzel** (criação de conteúdo) via ChatPanel compartilhado.
- Catálogo de **modelos LLM** (`/api/ai/models`), credenciais **NVIDIA NIM**, probe local (Ollama) e proxy LLM.
- Suíte de controle de inteligência (thinkcoffee): **Agentes, Skills, Memória, Sessões, Prompts, Hooks e Patches** (`apps/web/src/modules/ai`).

### Governança & Runtime de Agentes
- Dashboard de governança com 17 visões: Runtime (Plan-Act-Verify), Gateway/Sessões, Models, Tools (matriz de risco L0–L4), Policy, Approvals, SpecLock, Transactions, Verification, Audit, Config, Agents, Channels, Chat, Cron, Logs e Memory (`apps/web/src/modules/governance/dashboard`).
- SafetyNet: `validateCommand`, guardrails, dry-run, snapshots e roteamento de custos.

### RAG (Retrieval Augmented Generation)
- UI em `/rag` + backend em Next API routes (`apps/web/src/app/api/*`) sobre o núcleo `apps/web/src/server/rag`: engine RAG, vector store persistente, chat com fontes, conversas, documentos, auth, admin, health e MCP server.
- Integração **TOTVS** (proxy SOAP/REST com cache) e geração local via **Ollama**.

### Orquestração & Tool Calling
- Multiagente, function-calling, orquestrador de ferramentas, memória persistente, workflow determinístico, atendimento ao cliente, MCP e RAG (`apps/web/src/modules/orchestration`).
- Harness de tool calling (Kairos) com integração TOTVS/CIESA (`apps/web/src/modules/harness`).
- Catálogo MCP e planejador de agentes (`apps/web/src/modules/mcp-catalog`, `apps/web/src/modules/agent-planner`).

### Outros módulos
- **OSINT**: harness de investigação, due diligence e web search (`apps/web/src/modules/osint`).
- **GitHub Notifications**: módulo hexagonal completo (`apps/web/src/modules/github-notifications`).
- **OCR** (`apps/web/src/modules/ocr`), **coding agent Kairos-Dev** (`apps/web/src/modules/dev`) e repositórios de IA satélite (`bi`, `crm`, `financeiro`, `projetos`).

### Núcleo Rust zero-lib (Kaide)
- Crate `kaide` / binário `kaide` (`kaide-rs/core`, vendirado de `chronokairo/cli` — ver ADR-0042): agent, LLM, MCP, memory, skills, terminal, editor, tools, protocol, http, compressor, providers, app_server, async_rt, hw_recommend, image_gen — sem dependências externas.
- Casca Tauri fina (`kaide-rs/shell`) para execução desktop nativa, consumindo o `kaide` por path dependency.

### Telas de IA (data-screens)
- `/ia` e subpáginas: agentes autônomos, automação inteligente, LLMs, modelos de IA, NLP e visão computacional.

### Ferramentas absorvidas (`tools/`)
21 ferramentas: ai-sales, anamnesic-sdk, bi-rag, browser-mcp-lite, cki-lite, clamp, cloud-ai, context, ecommerce-mcp, ecommerce-nlp, educacional-ai, legal-ocr, llm-server, marketing-ai, mastery-inference, nvidia-llm-ranking, projects-ai, research-rag, rg, sandbox e security-ai.

## 🏗️ Arquitetura

```
kaide/
├── apps/web/                   # Frontend Next.js (React 19) + scripts
│   ├── src/
│   │   ├── app/                # App Router — /, /rag, /ia/* e API routes (/api/ai/*, /api/chat/*, /api/totvs/*, /api/auth/*, /api/froia, /api/rapunzel)
│   │   ├── domain/             # Entidades e regras de domínio (hexagonal)
│   │   ├── application/        # Casos de uso e portas (hexagonal)
│   │   ├── infrastructure/     # Adapters de infraestrutura (LLM, credenciais, Tauri, Supabase)
│   │   ├── features/           # Composição de features (ai-chat, ai-credentials)
│   │   ├── modules/            # Módulos de negócio (ai, rag, governance, harness, orchestration, osint, github-notifications, dev, ocr, mcp-catalog, agent-planner, bi, crm, financeiro, projetos)
│   │   │   └── rag/            # UI do subsistema RAG (RagApp) — rota /rag
│   │   ├── server/             # Núcleo do RAG (features, entities, shared) — consumido pelas API routes
│   │   ├── providers/          # Providers React (layout, harness, tauri runtime)
│   │   └── shared/             # Componentes/config compartilhados
│   └── scripts/                # Jobs do Control Plane + build Tauri
├── apps/desktop/               # App desktop (tauri.conf.json, icons, capabilities)
├── kaide-rs/                   # Workspace Rust (espelho do codex-rs/)
│   ├── core/                   # Crate zero-lib `kaide` (vendirado de chronokairo/cli)
│   ├── shell/                  # Casca Tauri fina (consome o core por path)
│   └── intelligence/           # Harness de OSINT e Due Diligence
├── sdk/typescript/             # @chronokairo/kaide-sdk — wrapper do binário kaide
├── tools/                      # 21 ferramentas de IA absorvidas (research, anamnesic, sandbox, ...)
├── mcp/                        # Servidores MCP
├── supabase/                   # Migrações e config Supabase
├── docs/                       # Documentação — ADRs (docs/adr) e mapas (docs/maps)
├── AGENTS.md                   # Regras do produto + índice de ADRs
└── package.json                # Workspaces npm (apps/web, sdk/typescript)
```

Princípios:
- **Núcleo Rust zero-lib** (`kaide-rs/core`, crate `kaide` / binário `kaide`): a lógica do agente/CLI é a fonte de verdade; o Tauri é apenas uma casca fina que a consome.
- **Frontend Next** consome a **UI compartilhada** do platform (`@chronokairo/platform/ui`).
- **Hexagonal**: domínio/casos de uso desacoplados de infraestrutura (ver `AGENTS.md`).

## 🌿 Branches

O histórico dos repositórios originais foi preservado como branches:
- `main` — monorepo unificado (este layout).
- `cli` — histórico do antigo `chronokairo/cli` (crate Rust zero-lib). Esse
  código virou o repo próprio [`chronokairo/cli`](https://gitlab.com/chronokairo/cli)
  (ver [ADR-0027](docs/adr/0027-extracao-core-ckc-para-repo-cli.md)); a branch
  fica aqui só como arquivo histórico.
- `desktop` — histórico do antigo `chronokairo/desktop` (Next + Tauri).

## 🚀 Desenvolvimento

Pré-requisitos: **Node.js 20+**, **npm**, e (para o desktop) **Rust/Cargo** + toolchain do Tauri.

```bash
git clone https://github.com/chronokairo/kaide.git
cd kaide
npm install
```

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Frontend Next em `http://localhost:3010` |
| `npm run build` | Build de produção do frontend |
| `npm start` | Serve o build de produção |
| `npm run tauri:dev` | App desktop Tauri (requer Rust/Cargo) |
| `npm test` | Testes (Vitest) |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |

O subsistema **RAG** (Ollama/TOTVS) roda como Next API routes (`apps/web/src/app/api/chat|search|conversations|totvs|auth|admin|health`) sobre o núcleo `apps/web/src/server/rag` — migração concluída (ADR-0005, débito #2).

## 📦 Stack

- **Núcleo:** Rust (zero-lib, crate `kaide`) + **Tauri 2** (desktop).
- **Frontend:** Next.js 16 (React 19) + Tailwind + `@chronokairo/platform/ui`.
- **RAG:** React + `react-markdown`/`chart.js`, Next API routes + Ollama + integração TOTVS.
- **Gerenciador de pacotes:** **npm**.

## 📚 Documentação

- ADRs: [`docs/adr/`](docs/adr/) — 22 decisões arquiteturais; índice completo em [`AGENTS.md`](AGENTS.md).
- Changelog: [`CHANGELOG.md`](CHANGELOG.md).
- Débitos técnicos e melhorias: [`TODO.md`](TODO.md).
- RAG: [`docs/rag/`](docs/rag/).

## 📄 Licença

**Proprietário — uso interno da ChronoKairo.** Todos os direitos reservados.
