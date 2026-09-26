# ChronoKairo AI

![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat&logo=tauri&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

Chat de IA da plataforma ChronoKairo e sua API de backend. Monorepo que consolida o núcleo de execução em **Rust** (zero-lib, crate `ckc`), o app desktop **Tauri 2**, o frontend **Next.js 16 / React 19**, o subsistema **RAG** (Ollama + TOTVS) e as ferramentas de IA absorvidas do ecossistema (thinkcoffee, intelligence, research, anamnesic, kairos etc.).

Consolidação dos antigos `cli`, `desktop` e `ai` — histórico preservado nas branches `cli` e `desktop`.

## ✨ Funcionalidades

### Chat & Agentes de IA (experiência principal)
- Chat com **streaming SSE** (`/api/ai/chat`) sobre arquitetura hexagonal (`src/domain` → `src/application` → `src/infrastructure`).
- Chats especializados **Froia** e **Rapunzel** (criação de conteúdo) via ChatPanel compartilhado.
- Catálogo de **modelos LLM** (`/api/ai/models`), credenciais **NVIDIA NIM**, probe local (Ollama) e proxy LLM.
- Suíte de controle de inteligência (thinkcoffee): **Agentes, Skills, Memória, Sessões, Prompts, Hooks e Patches** (`src/modules/ai`).

### Governança & Runtime de Agentes
- Dashboard de governança com 17 visões: Runtime (Plan-Act-Verify), Gateway/Sessões, Models, Tools (matriz de risco L0–L4), Policy, Approvals, SpecLock, Transactions, Verification, Audit, Config, Agents, Channels, Chat, Cron, Logs e Memory (`src/modules/governance/dashboard`).
- SafetyNet: `validateCommand`, guardrails, dry-run, snapshots e roteamento de custos.

### RAG (Retrieval Augmented Generation)
- UI em `/rag` + backend Express (`src/server/rag`): engine RAG, vector store persistente, chat com fontes, conversas, documentos, auth, admin, health e MCP server.
- Integração **TOTVS** (proxy SOAP/REST com cache) e geração local via **Ollama**.

### Orquestração & Tool Calling
- Multiagente, function-calling, orquestrador de ferramentas, memória persistente, workflow determinístico, atendimento ao cliente, MCP e RAG (`src/modules/orchestration`).
- Harness de tool calling (Kairos) com integração TOTVS/CIESA (`src/modules/harness`).
- Catálogo MCP e planejador de agentes (`src/modules/mcp-catalog`, `src/modules/agent-planner`).

### Outros módulos
- **OSINT**: harness de investigação, due diligence e web search (`src/modules/osint`).
- **GitHub Notifications**: módulo hexagonal completo (`src/modules/github-notifications`).
- **OCR** (`src/modules/ocr`), **coding agent Kairos-Dev** (`src/modules/dev`) e repositórios de IA satélite (`bi`, `crm`, `financeiro`, `projetos`).

### Núcleo Rust zero-lib (desktop)
- Crate `ckc` (`src-tauri/core`): agent, LLM, MCP, memory, skills, terminal, editor, tools, protocol, http, compressor, providers, app_server, async_rt, hw_recommend, image_gen — sem dependências externas.
- Casca Tauri fina (`src-tauri/shell`) para execução desktop nativa.

### Telas de IA (data-screens)
- `/ia` e subpáginas: agentes autônomos, automação inteligente, LLMs, modelos de IA, NLP e visão computacional.

### Ferramentas absorvidas (`tools/`)
21 ferramentas: ai-sales, anamnesic-sdk, bi-rag, browser-mcp-lite, cki-lite, clamp, cloud-ai, context, ecommerce-mcp, ecommerce-nlp, educacional-ai, legal-ocr, llm-server, marketing-ai, mastery-inference, nvidia-llm-ranking, projects-ai, research-rag, rg, sandbox e security-ai.

## 🏗️ Arquitetura

```
chronokairo-ai/
├── src/                      # Frontend Next.js (React 19)
│   ├── app/                  # App Router — /, /rag, /ia/* e API routes (/api/ai/*, /api/froia, /api/rapunzel)
│   ├── domain/               # Entidades e regras de domínio (hexagonal)
│   ├── application/          # Casos de uso e portas (hexagonal)
│   ├── infrastructure/       # Adapters de infraestrutura (LLM, credenciais)
│   ├── features/             # Composição de features (ai-chat, ai-credentials)
│   ├── modules/              # Módulos de negócio (ai, rag, governance, harness, orchestration, osint, github-notifications, dev, ocr, mcp-catalog, agent-planner, bi, crm, financeiro, projetos)
│   │   └── rag/              # UI do subsistema RAG (RagApp) — rota /rag
│   ├── server/               # Backend do RAG (Express) — débito: portar p/ API routes
│   ├── providers/            # Providers React (layout, harness, tauri runtime)
│   └── shared/               # Componentes/config compartilhados
│
├── src-tauri/                # App desktop (Cargo workspace)
│   ├── core/                 # Núcleo Rust zero-lib — crate `ckc` (fonte de verdade)
│   └── shell/                # Casca Tauri fina (consome o ckc)
│
├── tools/                    # 21 ferramentas de IA absorvidas (research, anamnesic, sandbox, ...)
├── docs/                     # Documentação — ADRs (docs/adr) e RAG (docs/rag)
├── AGENTS.md                 # Regras do produto + índice de ADRs
├── CHANGELOG.md              # Histórico de mudanças
├── TODO.md                   # Débitos técnicos e melhorias
└── package.json
```

Princípios:
- **Núcleo Rust zero-lib** (`src-tauri/core`, crate `ckc`): a lógica do agente/CLI é a fonte de verdade; o Tauri é apenas uma casca fina que a consome.
- **Frontend Next** consome a **UI compartilhada** do platform (`@chronokairo/platform/ui`).
- **Hexagonal**: domínio/casos de uso desacoplados de infraestrutura (ver `AGENTS.md`).

## 🌿 Branches

O histórico dos repositórios originais foi preservado como branches:
- `main` — monorepo unificado (este layout).
- `cli` — histórico do antigo `chronokairo/cli` (crate Rust zero-lib).
- `desktop` — histórico do antigo `chronokairo/desktop` (Next + Tauri).

## 🚀 Desenvolvimento

Pré-requisitos: **Node.js 20+**, **npm**, e (para o desktop) **Rust/Cargo** + toolchain do Tauri.

```bash
git clone https://github.com/chronokairo/ai.git
cd ai
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

O subsistema **RAG** (Ollama/TOTVS) tem backend Express em `src/server/rag`, executado à parte; a migração para Next API routes é um débito registrado em `docs/adr/0005`.

## 📦 Stack

- **Núcleo:** Rust (zero-lib, crate `ckc`) + **Tauri 2** (desktop).
- **Frontend:** Next.js 16 (React 19) + Tailwind + `@chronokairo/platform/ui`.
- **RAG:** React + `react-markdown`/`chart.js`, backend Express + Ollama + integração TOTVS.
- **Gerenciador de pacotes:** **npm**.

## 📚 Documentação

- ADRs: [`docs/adr/`](docs/adr/) — 22 decisões arquiteturais; índice completo em [`AGENTS.md`](AGENTS.md).
- Changelog: [`CHANGELOG.md`](CHANGELOG.md).
- Débitos técnicos e melhorias: [`TODO.md`](TODO.md).
- RAG: [`docs/rag/`](docs/rag/).

## 📄 Licença

**Proprietário — uso interno da ChronoKairo.** Todos os direitos reservados.
