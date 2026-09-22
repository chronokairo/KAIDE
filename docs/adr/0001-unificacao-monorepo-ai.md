# ADR-0001: Unificação do monorepo `ai` (núcleo zero-lib ckc + casca Tauri + Next/Vite)

- **Data:** 2026-09-22
- **Status:** Aceito (com débitos técnicos abertos)

## Contexto

Os repositórios `chronokairo/cli`, `chronokairo/desktop` e `chronokairo/ai` foram consolidados em `chronokairo/ai` (primeiro como branches `cli`/`desktop`/`main`, depois deletando os repos-fonte). O objetivo desta ADR é unificar tudo na `main`:

- **Rust:** o `cli` é um crate **zero-lib** (`ckc`) e é a **fonte de verdade**; o Rust do `desktop` (`src-tauri/src`, crate `chronokairo_intelligence_lib` baseado em tokio/tauri) estava **desatualizado**.
- **Frontend:** o `desktop` é **Next + Tauri**; o `ai` é um sistema **RAG em Vite + Deno/Express** (TOTVS, MCP, Ollama). Nada pode ser perdido.

## Decisão

### Núcleo Rust (prioriza o zero-lib do cli)
- `src-tauri/core/` = crate `ckc` (cli zero-lib) **preservado intacto**. Adicionado `[lib]` + `src/lib.rs` expondo os módulos (`agent`, `llm`, `mcp`, `tools`, `repo`, ...) para consumo externo, sem alterar o binário `ckc`.
- `src-tauri/shell/` = **casca Tauri fina** (`chronokairo_desktop_lib`) que depende do `ckc` via path e apenas faz o bootstrap do Tauri + comandos-ponte. O Rust desatualizado do `desktop` foi **descartado**.
- `src-tauri/Cargo.toml` = **Cargo workspace** com membros `core` (ckc) e `shell`, com `[profile.release]` no root.
- Validado com `cargo metadata` (workspace e deps resolvem: ckc, chronokairo-desktop, tauri, tauri-build, tauri-plugin-shell).

### Frontend (Next + Vite, sem perder nada)
- Raiz = **Next** (do desktop), frontend principal do app Tauri.
- `web-ai/` = o sistema **RAG Vite/Deno** do ai **preservado integralmente**, com seu próprio `package.json`/scripts (roda standalone).
- `package.json` raiz declara `web-ai` como npm workspace e expõe `web-ai:dev`/`web-ai:build`.

## Débitos Técnicos (ABERTOS)

1. **Wiring Tauri ↔ ckc**: os comandos Tauri que expõem as capacidades do núcleo (`agent`, `llm`, `tools`, `repo`, terminal, etc.) ainda serão conectados incrementalmente. Hoje há apenas um comando de exemplo (`ckc_version`).
2. **Fusão profunda do frontend**: portar as features RAG (TOTVS/MCP/Ollama) do `web-ai` (React 18/Vite) para dentro do Next (React 19).
3. **`cargo build` completo** não executado nesta fase (apenas `cargo metadata`): a compilação real do Tauri + ckc deve ser validada em ambiente com toolchain/deps.

### Atualização 2026-09-22 (RAG movido para src/, UI do platform)

- **RAG unificado no Next**: o conteúdo do `web-ai/` foi movido para `src/` — frontend em `src/modules/rag/` (`RagApp.tsx`, exposto na rota `/rag`) e backend em `src/server/rag/`. A pasta `web-ai/` foi removida; docs preservados em `docs/rag/`. Deps do RAG instaladas na raiz (react-markdown, chart.js, react-chartjs-2, jspdf, html2canvas) via **npm**.
- **DÉBITO — backend Express do RAG**: `src/server/rag` é o servidor Express original (`express`, `ollama`, `lowdb`, `node-cache`, `express-rate-limit`, `http-proxy-middleware`) e **não** foi portado para Next API routes. Está **excluído do type-check do Next** (`tsconfig` `exclude: ["src/server"]`) para não quebrar o build. Ação futura: portar as rotas Express para `app/api/**/route.ts` e instalar/typar as deps, ou rodar o servidor como processo separado.
- **DÉBITO — UI do platform**: adicionada a dependência `@chronokairo/platform` (git, npm) para o `ai` consumir a UI compartilhada (`@chronokairo/platform/ui`). A **substituição dos componentes de shell locais** (`src/shared/components/dashboard/{SideNavBar,TopNavBar,BottomNavBar}`) pelos equivalentes do platform ainda **não foi feita** — fica como débito para uma passada dedicada, evitando regressões visuais na entrega atual.

## Consequências

- Tudo consolidado na `main` do `ai`, **sem perda** de código (Rust do cli, casca Tauri, Next do desktop, RAG Vite do ai).
- O zero-lib do cli permanece íntegro como núcleo; o Tauri é uma casca que o consome.
- Os débitos ficam rastreáveis e priorizáveis, sem bloquear a consolidação estrutural.
