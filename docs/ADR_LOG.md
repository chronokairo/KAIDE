# ADR Log — `chronokairo/ai`

Decisões arquiteturais do produto de IA (RAG, MCP, integrações, chat, desktop Tauri).

| ADR | Título | Data | Status |
| :--- | :--- | :---: | :---: |
| [ADR-0001](./adr/0001-unificacao-monorepo-ai.md) | Unificação do monorepo `ai` | — | Aceito |
| [ADR-0002](./adr/0002-centralizacao-ia-no-ai.md) | Centralização da IA do ecossistema no `ai` (recebe FroiaChat/proxy do froia; remove LLM providers p/ readição desacoplada) | 2026-09-23 | Aceito |
| [ADR-0003](./adr/0003-centralizacao-telas-ia-data.md) | Centralização das telas de IA do app data no `ai` (subpath `./data-screens`) | 2026-09-23 | Aceito |
| [ADR-0004](./adr/0004-rename-package-chronokairo-ai.md) | Renomear pacote `chronokairo-desktop` → `@chronokairo/ai` (escopo npm consistente com ecossistema) | 2026-09-23 | Aceito |
| [ADR-0005](./adr/0005-debitos-tecnicos-pos-centralizacao.md) | Registro dos débitos técnicos pós-centralização (providers, RAG, UI, wiring) | 2026-09-23 | Aceito (débitos abertos) |
| [ADR-0006](./adr/0006-rapunzel-chat-conteudo.md) | Rapunzel: variante de chat de criação de conteúdo (subpath `./rapunzel`) com `ChatPanel` compartilhado com o Froia | 2026-09-24 | Aceito |
| [ADR-0007](./adr/0007-absorcao-governanca-thinkcoffee.md) | Absorção dos ativos de governança e segurança do ThinkCoffee (`@chronokairo/ai/governance`) | 2026-09-24 | Aceito |
| [ADR-0008](./adr/0008-absorcao-osint-intelligence-harness.md) | Absorção do OSINT Intelligence Harness e ferramentas de investigação | 2026-09-24 | Aceito |
| [ADR-0009](./adr/0009-absorcao-tool-calling-kairos-harness.md) | Absorção de tool calling e harness do Kairos | 2026-09-25 | Aceito |
| [ADR-0010](./adr/0010-absorcao-sala-e-core-capacidades-ia.md) | Absorção da Sala e core de capacidades de IA | 2026-09-25 | Aceito |
| [ADR-0011](./adr/0011-consolidacao-kairos-dev-coding-agent.md) | Consolidação do coding agent nativo e runtime do Kairos | 2026-09-25 | Aceito |
| [ADR-0012](./adr/0012-absorcao-athena-rag-unificado.md) | Absorção do Athena (RAG Unificado e Ecossistema Legado) | 2026-09-25 | Aceito |
| [ADR-0013](./adr/0013-absorcao-rag-mcp-e-ranking-research.md) | Absorção dos Módulos de IA do Research (RAG/MCP e NVIDIA LLM Ranking) | 2026-09-25 | Aceito |
| [ADR-0014](./adr/0014-absorcao-clamp-tool-calling-slm.md) | Absorção do Clamp (Scaffolding de Tool Calling e Confiabilidade para SLMs) | 2026-09-25 | Aceito |
| [ADR-0015](./adr/0015-absorcao-anamnesic-bridges-ide.md) | Absorção do Anamnesic Bridges (Bridges de IDE: VS Code e Antigravity para Ollama API) | 2026-09-25 | Aceito |
| [ADR-0016](./adr/0016-absorcao-sandbox-aegisos.md) | Absorção do AegisOS / Anamnesic Sandbox (Execução Segura em Containers) | 2026-09-25 | Aceito |
| [ADR-0017](./adr/0017-absorcao-anamnesic-context-memory-mcp.md) | Absorção do Anamnesic Context (Memória de Agentes, Context Engine e MCP Server) | 2026-09-25 | Aceito |
| [ADR-0018](./adr/0018-absorcao-agent-dashboard-governance.md) | Absorção do Agent Control Center / Dashboard (Governância & Runtime) | 2026-09-25 | Aceito |
| [ADR-0019](./adr/0019-absorcao-cki-lite-terminal-agent-e-winforms.md) | Absorção do CKI-Lite (Terminal Agent NVIDIA NIM Python & Client WinForms) | 2026-09-25 | Aceito |
| [ADR-0020](./adr/0020-remocao-por-traineddata-vestigial.md) | Remoção do `por.traineddata` vestigial e saneamento do módulo OCR | 2026-09-25 | Aceito |
| [ADR-0021](./adr/0021-absorcao-ia-projetos-crm-e-satelites.md) | Absorção e Centralização das Capacidades de IA Satélites no `ai` | 2026-09-26 | Aceito |

## Débitos técnicos abertos
- **`mcp/` e telas legadas kairos** (2026-09-23): recebidos de vendas/crm; integrar como capacidade MCP e portar o design de chat das telas (`src/modules/ai/legacy-kairos-screens` → REPL/Doctor/ResumeConversation) sem reintroduzir código do fork Claude Code.
- **Readicionar LLM providers desacoplados** (ADR-0002/0005): 17 providers removidos por dependerem de `kairos/plugin-sdk` (não publicado). Padrão de desacoplamento validado no piloto `groq` (shim `_sdk/`). Providers pesados (google, github-copilot, ollama, deepinfra) exigem reimplementar runtime de image/video/speech/oauth/embeddings.
- **Backend RAG Express → Next API routes** (ADR-0005): `src/server/rag` segue excluído do typecheck; portar para `src/app/api/`.
- **UI shell/navegação para `@chronokairo/platform/ui`** (ADR-0005): AppBar, navegação e tokens ainda locais; não duplicar componentes compartilhados.
- **Wiring dos comandos Tauri ao núcleo `ckc`** (ADR-0005): casca `src-tauri/shell` deve chamar comandos do crate `ckc` (zero-lib) incrementalmente.
- **Rotas de IA vindas do platform** (ADR-0005): `src/app/api/ai/*` e `ai-credentials` recém-recebidos aguardam cobertura de testes de integração e validação de CORS/auth nos caminhos públicos.
- **Roadmap de features a partir dos changelogs do mercado** (2026-09-26): objetivo é reimplementar do zero (fundação → avançado) as features dos coding agents CLI/desktop do mercado.
  - ✅ Changelogs baixados em `docs/market/changelogs/`. Histórico completo de releases estáveis (GitHub API, paginado): codex, gemini-cli, opencode, qwen-code, goose, crush, continue, zed, openhands, plandex, void, kilo-code. CHANGELOG do repo: claude-code, copilot-cli, cline, roo-code, aider. Páginas web convertidas (só a página mais recente): cursor, windsurf, factory-droid, amp, kiro, augment.
  - 🟡 Histórico completo: faltam as páginas antigas do Cursor (`cursor.com/changelog/page/N`, baixadas só em `/tmp`, não persistidas), changelog web do Codex (`developers.openai.com/codex/changelog`) e histórico antigo de Windsurf/Factory/Amp/Kiro/Augment. Kilo-code só tem releases desde 2026-02 (repo novo). Continue, plandex e void estão sem releases recentes (baixa prioridade).
  - ✅ Extrair catálogo de features por produto: digests da janela mai–set/2026 consolidados por área (aprovals/classificador de risco, sandbox, MCP 2026-07-28, subagentes, compaction, ACP, autonomia/event-driven, workbench de supervisão, custos/telemetria, supply-chain) em `docs/market/TODO.md`, com panorama set/2026 e tabela de cobertura do corpus.
  - ✅ Cruzar com o estado atual: seção "Já rastreado em outros documentos" do `docs/market/TODO.md` mapeia desktop-gap D01–D22, adr/0015 C1–C9/R1–R3, gap-analysis-vision e `src-tauri/core/TODO.md`; o TODO lista apenas deltas novos, cada um com fonte (produto + versão/data) e marca "refina X" quando estende item existente.
  - ✅ TODO roadmap montado em `docs/market/TODO.md` (36 itens P1–P3 por área: núcleo `ckc`, protocolo/multi-superfície, shell desktop Tauri, autonomia/review/integrações, plataforma/segurança/governança) e referenciado no índice de TODOs do `AGENTS.md`.
  - ✅ (2026-09-26) P0s de fundação validados com testes de integração: `src-tauri/core/tests/p0_{agent,tools,llm,context,server}.rs` (27 testes, loop com LLM ollama em loopback sem rede externa) e os 3 P0s restantes implementados: worktree/checkpoints no `ckc` (`tools/worktree.rs` + `agent/checkpoint.rs` + tools no registry + 6 métodos no runtime_api; testes em `tests/p0_worktree.rs`), tela canônica de task supervision (`src/modules/ai/components/TaskSupervisionScreen.tsx`, nav `tasks`) e distribuição/auto-update (updater Tauri completo). Suite: 519 unit + 31 integração Rust, typecheck limpo, 11 vitest.
  - 🟡 (2026-09-26) Cargo check da casca Tauri no Linux: `tao` → `dbus` → `libdbus-sys` exige `libdbus-1-dev`+`pkg-config` (indisponível sem sudo neste ambiente). O wiring do updater (`tauri-plugin-updater/process`, comandos `check_for_updates`/`install_update`, `plugins.updater` com keypair real) foi validado estruturalmente; compilar em Windows/macOS (alvos NSIS) ou após instalar as deps de sistema.
  - 🟡 (2026-09-26, pré-existente) Build estático do Tauri (`TAURI_BUILD=true`, `output: export`) é incompatível com API routes `force-dynamic` (`/api/[...path]`, `/api/ai/*`...). O desktop estático não pode servir as rotas Next — decidir: mover a API para o backend hexagonal (ADR-0022) ou excluir as rotas do build Tauri. Blocker para "build limpo e reproduzível" do `docs/desktop-gap-analysis-2026.md`.
  - 🟡 (2026-09-26) Keypair do updater: privada em `~/.chronokairo/keys/chronokairo-updater.key` (fora do repo); endpoint de releases (`https://releases.chronokairo.ai/...`) a provisionar; assinar releases com `TAURI_SIGNING_PRIVATE_KEY_PATH`.
