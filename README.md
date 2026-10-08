<p align="center"><strong>Kaide</strong> is a coding agent from ChronoKairo (Kairos Code + AI + IDE) that runs locally on your computer.</p>

<p align="center">
  <a href="#english">English</a> · <a href="#português">Português</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Tauri-24C8DB?style=flat&logo=tauri&logoColor=white" alt="Tauri" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
</p>

<p align="center">
If you want Kaide in your terminal, build the core and run <code>npx kaide</code>.
</br>If you want the desktop app experience, run <code>npm run desktop:dev</code> (Tauri 2).
</br>If you want the web experience, run <code>npm run dev</code> (Next.js at <code>http://localhost:3010</code>).</p>

---

## English

**Kaide** (Kairos Code + AI + IDE) is ChronoKairo's coding agent: a zero-lib Rust core (`kaide`), a Tauri 2 desktop app, a Next.js web app with RAG (Ollama + TOTVS) and a virtual-agents Control Plane — all in one monorepo, mirroring the layout of [`openai/codex`](https://github.com/openai/codex) (`kaide-rs/` ↔ `codex-rs/`, `sdk/typescript/` ↔ `codex-cli/`).

### Installing and running Kaide

Prerequisites: **Node.js 20+**, **npm**, and (for the desktop app) **Rust/Cargo** + the [Tauri prerequisites](https://tauri.app/start/prerequisites/) for your OS.

```shell
# Clone (private repo — requires access) and install
git clone https://github.com/chronokairo/kaide.git
cd kaide
npm install
```

Build the Rust core and run it through the SDK wrapper (resolves `KAIDE_BIN` → `kaide-rs/target/debug|release/kaide` → `kaide` on PATH):

```shell
# Build the core binary
cargo build --manifest-path kaide-rs/Cargo.toml -p ckc --bin kaide

# Then simply run kaide to get started
npx kaide --help
```

Desktop and web run from the same checkout:

```shell
# Desktop app (Tauri 2)
npm run desktop:dev

# Web app (Next.js at http://localhost:3010)
npm run dev
```

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js frontend at `http://localhost:3010` |
| `npm run build` | Production frontend build (static export for Tauri) |
| `npm start` | Serve the production build |
| `npm run desktop:dev` / `npm run desktop:build` | Tauri desktop app (requires Rust/Cargo) |
| `npm run rust:check` / `npm run rust:test` | Check / test the `kaide-rs/` workspace |
| `npm test` | Web tests (Vitest) |
| `npm run typecheck` | Type checking (`tsc --noEmit`) |

### Using Kaide with your providers

Kaide works with local models via **Ollama** and cloud models via configured providers (including NVIDIA NIM credentials and an LLM proxy). Provider secrets stay server-side only — they are never bundled into the browser or desktop frontend. See [`AGENTS.md`](AGENTS.md) for the authorization and human-approval rules (AI → AI → AI → HUMAN, never AI → production).

### Docs

- [**Product rules & architecture**](AGENTS.md) (hexagonal, Control Plane, ADR index)
- [**ADRs**](docs/adr/) (see [ADR-0042](docs/adr/0042-reunificacao-monorepo-kaide-estilo-codex.md) for the monorepo reunification)
- [**Contributing**](CONTRIBUTING.md)
- [**Changelog**](CHANGELOG.md) · [**Tech debt**](TODO.md) · [**RAG**](docs/rag/)

### Repository layout

```text
kaide/
├── apps/web/         # Next.js frontend + Control Plane jobs + RAG (apps/web/src/…)
├── apps/desktop/     # Tauri app (tauri.conf.json, icons, capabilities)
├── kaide-rs/         # Cargo workspace: core/ (zero-lib `kaide`), shell/, intelligence/
├── sdk/typescript/   # @chronokairo/kaide-sdk — resolves and runs the `kaide` binary
├── tools/            # Absorbed AI tools · mcp/ · supabase/ · docs/
└── package.json      # npm workspaces (apps/web, sdk/typescript)
```

### License

**Proprietary — internal ChronoKairo use.** All rights reserved.

---

## Português

**Kaide** (Kairos Code + AI + IDE) é o coding agent da ChronoKairo: um núcleo Rust zero-lib (`kaide`), um app desktop Tauri 2, um app web Next.js com RAG (Ollama + TOTVS) e um Control Plane de agentes virtuais — tudo num monorepo só, espelhando o layout do [`openai/codex`](https://github.com/openai/codex) (`kaide-rs/` ↔ `codex-rs/`, `sdk/typescript/` ↔ `codex-cli/`).

### Instalando e executando o Kaide

Pré-requisitos: **Node.js 20+**, **npm** e (para o app desktop) **Rust/Cargo** + os [pré-requisitos do Tauri](https://tauri.app/start/prerequisites/) do seu SO.

```shell
# Clone (repo privado — requer acesso) e instale
git clone https://github.com/chronokairo/kaide.git
cd kaide
npm install
```

Compile o núcleo Rust e execute pelo wrapper do SDK (resolve `KAIDE_BIN` → `kaide-rs/target/debug|release/kaide` → `kaide` no PATH):

```shell
# Compila o binário do núcleo
cargo build --manifest-path kaide-rs/Cargo.toml -p ckc --bin kaide

# E execute o kaide para começar
npx kaide --help
```

Desktop e web rodam do mesmo checkout:

```shell
# App desktop (Tauri 2)
npm run desktop:dev

# App web (Next.js em http://localhost:3010)
npm run dev
```

| Comando | Descrição |
| --- | --- |
| `npm run dev` | Frontend Next.js em `http://localhost:3010` |
| `npm run build` | Build de produção do frontend (export estático para o Tauri) |
| `npm start` | Serve o build de produção |
| `npm run desktop:dev` / `npm run desktop:build` | App desktop Tauri (requer Rust/Cargo) |
| `npm run rust:check` / `npm run rust:test` | Check / testes do workspace `kaide-rs/` |
| `npm test` | Testes do web (Vitest) |
| `npm run typecheck` | Verificação de tipos (`tsc --noEmit`) |

### Usando o Kaide com seus provedores

O Kaide funciona com modelos locais via **Ollama** e modelos de nuvem via provedores configurados (incluindo credenciais NVIDIA NIM e proxy LLM). Segredos de provedores ficam somente no backend — nunca no frontend web ou desktop. Veja o [`AGENTS.md`](AGENTS.md) para as regras de autorização e aprovação humana (AI → AI → AI → HUMAN, nunca AI → produção).

### Documentação

- [**Regras do produto e arquitetura**](AGENTS.md) (hexagonal, Control Plane, índice de ADRs)
- [**ADRs**](docs/adr/) (ver [ADR-0042](docs/adr/0042-reunificacao-monorepo-kaide-estilo-codex.md) sobre a reunificação do monorepo)
- [**Contribuição**](CONTRIBUTING.md)
- [**Changelog**](CHANGELOG.md) · [**Débitos técnicos**](TODO.md) · [**RAG**](docs/rag/)

### Estrutura do repositório

```text
kaide/
├── apps/web/         # Frontend Next.js + jobs do Control Plane + RAG (apps/web/src/…)
├── apps/desktop/     # App Tauri (tauri.conf.json, icons, capabilities)
├── kaide-rs/         # Workspace Cargo: core/ (zero-lib `kaide`), shell/, intelligence/
├── sdk/typescript/   # @chronokairo/kaide-sdk — resolve e executa o binário `kaide`
├── tools/            # Ferramentas de IA absorvidas · mcp/ · supabase/ · docs/
└── package.json      # Workspaces npm (apps/web, sdk/typescript)
```

### Licença

**Proprietária — uso interno da ChronoKairo.** Todos os direitos reservados.
