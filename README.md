# ChronoKairo AI

Produto de IA da plataforma ChronoKairo: **chat/agente de IA** com núcleo de execução em Rust (zero-lib), casca **Tauri** para desktop, frontend **Next.js** e um subsistema **RAG** (Retrieval Augmented Generation) com integração TOTVS/Ollama.

Este repositório é a consolidação (monorepo) dos antigos `cli`, `desktop` e `ai`.

![Rust](https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white)
![Tauri](https://img.shields.io/badge/Tauri-24C8DB?style=flat&logo=tauri&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)

## 🏗️ Arquitetura

```
chronokairo-ai/
├── src/                     # Frontend Next.js (React 19)
│   ├── app/                 # App Router (/, /rag, ...)
│   ├── modules/             # Features (ai, rag, crm, bi, financeiro, projetos, github-notifications)
│   │   └── rag/             # UI do subsistema RAG (RagApp) — rota /rag
│   ├── server/              # Backend do RAG (Express) — débito: portar p/ API routes
│   ├── providers/           # Providers React (layout, harness, tauri runtime)
│   └── shared/              # Componentes/config compartilhados
│
├── src-tauri/               # App desktop (Cargo workspace)
│   ├── core/                # Núcleo Rust zero-lib — crate `ckc` (fonte de verdade)
│   ├── shell/               # Casca Tauri fina (consome o ckc)
│   └── tauri.conf.json
│
├── docs/                    # Documentação e ADRs (docs/adr, docs/rag)
├── next.config.mjs
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

# Frontend Next (web)
npm run dev            # http://localhost:3010

# App desktop (Tauri) — requer Rust/Cargo
npm run tauri:dev

# Build de produção do frontend
npm run build
```

O subsistema **RAG** (Ollama/TOTVS) tem backend Express em `src/server/rag` (hoje executado à parte; a migração para Next API routes é um débito registrado em `docs/adr/0001`).

## 📦 Stack

- **Núcleo:** Rust (zero-lib, crate `ckc`) + **Tauri 2** (desktop).
- **Frontend:** Next.js 16 (React 19) + Tailwind + `@chronokairo/platform/ui`.
- **RAG:** React + `react-markdown`/`chart.js`, backend Express + Ollama + integração TOTVS.
- **Gerenciador de pacotes:** **npm**.

## 📚 Documentação

- ADRs: [`docs/adr/`](docs/adr/) — ver `0001-unificacao-monorepo-ai.md` (decisões e débitos técnicos abertos).
- RAG: [`docs/rag/`](docs/rag/).

## 📄 Licença

**Proprietário — uso interno da ChronoKairo.** Todos os direitos reservados.
