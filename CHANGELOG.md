# Changelog

Histórico de mudanças notáveis do `@chronokairo/ai`.
O formato segue [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não lançado]

### 2026-09-26

#### Adicionado
- Migração da UI do chat RAG (`/rag`) para o design system ChronoKairo (ADR-0005, débito #3 parcial): `RagApp` consome `ThemeProvider`, `ThemeToggle` e `Button` de `@chronokairo/platform/ui`; tema claro/escuro alternável no header (persistido em `localStorage`).
- Sistema de tokens themáveis em `src/app/globals.css`: `@theme` Tailwind v4 apontando para CSS vars com paletas `.dark` (padrão, valores inalterados) e `.light`; `RagApp.css` reescrito com as mesmas vars (prose, scrollbar, focus, typing cursor) e sem diretivas `@tailwind` v3 vestigiais.
- Migração do backend RAG para Next API routes (ADR-0005, débito #2): 47 rotas em `src/app/api/*` (chat, search, conversas, mensagens, TOTVS, auth, admin, health, proxy catch-all) com adaptadores `_lib` (rag, http, rate-limit, auth, sse, totvs-proxy); clients SOAP/REST migrados de `shared/lib/http` (Express) para `http-core`; `resolve.extensionAlias` no webpack para imports ESM `.js`→`.ts` do legado.
- Migração hexagonal Fase 0/1 sem deleção de código (ADR-0022): `src/domain`, `src/application` (portas e caso de uso `send-message`), `src/infrastructure` (adapters), composição em `src/features/ai-chat` e rota `/api/ai/chat` reescrita como adapter HTTP fino; suíte de testes com Vitest (11 testes).
- Absorção e centralização das capacidades de IA satélites de projects, crm, bi, marketing, legal, nimbus, security, mastery, educacional e ecommerce (ADR-0021).

#### Corrigido
- Build do client quebrado pelo barrel `@/modules/governance` puxando `fs`/`fs-promises` (services server-only) para o client bundle via `SecurityPanel`; o painel agora importa `validateCommand` direto de `command-validator`.
- 67 erros de typecheck do legado thinkcoffee em `src/modules`:
  - imports dos 16 views do dashboard de governança apontados para `./types`;
  - imports do function-calling apontados para `../../harness/contracts` e `../../harness/shared`;
  - tipos ausentes criados em `dashboard/types.ts` (`Channel`, `DevicePairing`, `ChatMessage`, `ToolCall`, `CronJob`, `LogEntry`, `DreamEntry`) e estendidos (`Session`, `Agent`, `ToolDefinition`);
  - `governance/data/mockData.ts` criado para o ConfigView;
  - `default` adicionado ao `getRiskBadge` do ToolsView (erros de `possibly undefined`);
  - dependências de markdown instaladas (`remark-math`, `remark-gfm`, `rehype-katex`, `rehype-raw`).

#### Alterado
- `RagApp.tsx`: ~80 classes de cor hardcoded (`gray`, `indigo`, `amber`) substituídas por tokens semânticos (`surface-container`, `on-surface-variant`, `outline`, `primary`, `secondary`); branding Athena → ChronoKairo AI (header, welcome, export PDF, IDs de chat); cores de status semânticas (verde/vermelho/azul etc.) preservadas; export PDF e gráficos Chart.js leem cores via `cssVar()` para acompanhar o tema.
- `.npmrc` com `allow-git=root` — npm >= 12 bloqueia dependências git por padrão (EALLOWGIT).

### 2026-09-25

#### Adicionado
- Absorção dos módulos de IA do Research: `nvidia-llm-ranking` e `research-rag` (ADR-0013).
- Absorção do Clamp — scaffolding de tool calling e confiabilidade para SLMs (ADR-0014).
- Absorção do Anamnesic Bridges — bridges de IDE (VS Code/Antigravity) e `llm-server` (ADR-0015).
- Absorção do AegisOS/Anamnesic Sandbox — execução segura em containers (ADR-0016).
- Absorção do Anamnesic Context — memória de agentes, context engine e MCP server (ADR-0017).
- Absorção do Agent Control Center/Dashboard — visões operacionais de governança e runtime (ADR-0018).
- Absorção do CKI-Lite — terminal agent NVIDIA NIM (Python) e client WinForms (ADR-0019).
- Consolidação do Kairos-Dev — coding agent, prompts de sistema e ferramentas ripgrep (ADR-0011).
- Absorção dos módulos Sala e Core — capacidades de IA, multiagente, catálogo MCP e agent planner (ADR-0010).
- Absorção do ToolSectorHarness e motor de agentes Kairos (ADR-0009).
- OCR: absorção de modelo OCR e LLM proxy servers do operations.

#### Removido
- `por.traineddata` vestigial em `src/modules/ocr` (ADR-0020).

### 2026-09-24

#### Adicionado
- Absorção do harness de OSINT, due diligence, busca web em Rust e bancada de investigação (ADR-0008).
- Absorção de SafetyNet, guardrails, dry-run, snapshots e roteamento de custos do ThinkCoffee (ADR-0007).
- Rapunzel — chat de criação de conteúdo via ChatPanel compartilhado (ADR-0006).
- Formalização da absorção do ThinkCoffee e da consolidação cli/desktop (docs).

### 2026-09-23

#### Adicionado
- Rotas `ia/*` (`src/app/(ia)/ia`) consumindo data-screens local — a IA sai do app data (ADR-0002/0003).
- MCP de vendas e telas do agent Kairos como referência de port (`legacy-kairos-screens`).
- ADR-0005 — registro dos débitos técnicos pós-centralização.

#### Alterado
- Pacote renomeado de `chronokairo-desktop` para `@chronokairo/ai` (ADR-0004).

### Consolidação inicial

#### Adicionado
- ADR-0001 — unificação do monorepo `ai`: núcleo Rust zero-lib (`ckc`), casca Tauri e frontend Next; histórico dos repositórios originais preservado nas branches `cli` e `desktop`.
