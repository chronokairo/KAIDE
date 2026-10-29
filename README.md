<p align="center"><strong>Kaide</strong> is an open-source coding agent and autonomous multi-agent virtual engineering platform from Chronokairo (Kairos Code + AI + IDE).</p>

<p align="center">
  <a href="#english">English</a> · <a href="#português">Português</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="Apache 2.0" />
  <img src="https://img.shields.io/badge/Rust-000000?style=flat&logo=rust&logoColor=white" alt="Rust" />
  <img src="https://img.shields.io/badge/Tauri_2-24C8DB?style=flat&logo=tauri&logoColor=white" alt="Tauri 2" />
  <img src="https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white" alt="Next.js" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Supabase-Self--Hosted-3ECF8E?style=flat&logo=supabase&logoColor=white" alt="Supabase" />
</p>

<p align="center">
  Terminal CLI: <code>npx kaide</code> · Desktop App: <code>npm run desktop:dev</code> · Web Studio: <code>npm run dev</code> (<code>http://localhost:3010</code>)
</p>

---

## English

**Kaide** (Kairos Code + AI + IDE) is an AI-first software engineering platform:
- A high-performance **zero-lib Rust core** (`kaide-rs/core`).
- A **Tauri 2 desktop client** (`apps/desktop`).
- A **Next.js web application** with Control Plane supervision, Three.js visualization, and RAG (`apps/web`).
- A durable **Control Plane** managing roles (Coder, QA, DevOps, Commercial, Finance, Support) governed by the human-in-the-loop principle: **`AI → AI → AI → HUMAN`**.
- Layout mirroring [`openai/codex`](https://github.com/openai/codex) (`kaide-rs/` ↔ `codex-rs/`, `sdk/typescript/` ↔ `codex-cli/`).

### Quickstart

Prerequisites: **Node.js 20+**, **npm**, and optionally **Rust/Cargo** (for desktop/core builds) and **Docker** (for Supabase self-hosted).

```bash
# 1. Clone the repository
git clone https://github.com/chronokairo/KAIDE.git
cd KAIDE

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
```

#### Run the Terminal Coding Agent
```bash
# Build the Rust binary
cargo build --manifest-path kaide-rs/Cargo.toml -p kaide --bin kaide

# Run via SDK wrapper
npx kaide --help
```

#### Run the Web Control Plane
```bash
npm run dev
# Open http://localhost:3010
```

#### Run the Desktop App (Tauri 2)
```bash
npm run desktop:dev
```

### Self-Hosted Supabase Setup

KAIDE supports both Supabase Cloud and 100% private Self-Hosted deployments.
The bundled stack is a local/private development baseline. Its ports bind to localhost. Generate private credentials before starting it; production deployments require the maintained upstream Supabase stack and deployment-specific hardening:

```bash
cd supabase/self-hosted
python configure.py
python configure.py --check
docker compose up -d
```
See the [Supabase Guide](supabase/README.md) for full setup instructions and CLI workflows.

### Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Web Control Plane at `http://localhost:3010` |
| `npm run build:web` | Production Next.js build |
| `npm test` | Vitest test suite |
| `npm run typecheck` | TypeScript verification (`tsc --noEmit`) |
| `npm run desktop:dev` | Launch Tauri 2 desktop app |
| `npm run rust:check` | Cargo check across `kaide-rs/` workspace |
| `npm run rust:test` | Rust unit and integration test suite |

### Architecture & Security

- **Hexagonal Architecture:** Domain (`apps/web/src/domain`) and Ports (`src/application/ports`) are completely decoupled from UI and infrastructure adapters.
- **Fail-Closed Execution:** Destructive actions, tool executions, and deployments require explicit human approval via the Control Plane.
- **Provider Agnostic:** Supports local inference (**Ollama**) and cloud providers (**NVIDIA NIM**, OpenAI, Anthropic) behind typed ports.

### License

Distributed under the **Apache License 2.0**. See [`LICENSE`](LICENSE) for details.

---

## Português

**Kaide** (Kairos Code + AI + IDE) é uma plataforma de engenharia de software AI-first e empresa virtual de agentes autônomos:
- Núcleo em **Rust zero-lib** de alta performance (`kaide-rs/core`).
- Casca desktop nativa em **Tauri 2** (`apps/desktop`).
- Aplicação web em **Next.js** com Control Plane, cena Three.js de monitoramento e RAG (`apps/web`).
- **Control Plane** resiliente orquestrando papéis (Coder, QA, DevOps, Comercial, Finanças, Suporte) sob o princípio: **`AI → AI → AI → HUMAN`**.
- Estrutura espelhada do [`openai/codex`](https://github.com/openai/codex).

### Instalação Rápida

Pré-requisitos: **Node.js 20+**, **npm**, e opcionalmente **Rust/Cargo** e **Docker**.

```bash
# 1. Clone o repositório
git clone https://github.com/chronokairo/KAIDE.git
cd KAIDE

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
```

#### Executar o Agente no Terminal
```bash
cargo build --manifest-path kaide-rs/Cargo.toml -p kaide --bin kaide
npx kaide --help
```

#### Executar a Interface Web (Control Plane)
```bash
npm run dev
# Acesse http://localhost:3010
```

#### Executar o App Desktop (Tauri 2)
```bash
npm run desktop:dev
```

### Supabase Self-Hosted

O KAIDE funciona tanto com Supabase Cloud quanto com instâncias privadas **Self-Hosted**.
Para iniciar a stack completa do backend (Postgres com pgvector, Auth, PostgREST, Kong, Studio):

```bash
cd supabase/self-hosted
python configure.py
python configure.py --check
docker compose up -d
```
Consulte o [Guia do Supabase](supabase/README.md) para detalhes de configuração e migrations.

### Licença

Distribuído sob a licença **Apache License 2.0**. Consulte [`LICENSE`](LICENSE) para mais informações.
