# ADR-0024 — Roadmap de paridade com o mercado: P0s validados com testes de integração e os 3 P0s restantes implementados

**Status:** Aceito (débitos abertos)
**Data:** 2026-09-26

## Contexto

O objetivo do roadmap de mercado é reimplementar do zero (fundação → avançado)
as features dos coding agents CLI/desktop de referência. A fundação já existia
no núcleo `ckc` (loop com tool calling, tools, sandbox/exec_policy, streaming,
multi-providers, sessões, compactação, TUI, MCP, subagentes, memória, skills,
`AGENTS.md`, hooks, app-server, protocolo versionado, patch/diff, shell com
approvals) — porém sem bateria de testes que provasse cada capability pela API
pública, e com 3 P0s ausentes: worktree por task, tela canônica de supervisão e
distribuição/auto-update.

## Decisão

1. **Corpus de mercado**: changelogs persistidos em `docs/market/changelogs/`
   (histórico completo de releases estáveis via GitHub API: codex, gemini-cli,
   opencode, qwen-code, goose, crush, continue, zed, openhands, plandex, void,
   kilo-code; CHANGELOG do repo: claude-code, copilot-cli, cline, roo-code,
   aider; páginas web recentes: cursor, windsurf, factory-droid, amp, kiro,
   augment). Digests mai–set/2026 por área consolidados no roadmap
   `docs/market/TODO.md` (36 itens P1–P3), cruzado com os documentos internos
   (desktop-gap D01–D22, adr/0015, `src-tauri/core/TODO.md`) e referenciado no
   índice de TODOs do `AGENTS.md`.
2. **Validação da fundação**: testes de integração em
   `src-tauri/core/tests/p0_{agent,tools,llm,context,server}.rs` (27 testes)
   exercitando a API pública do `ckc` — um por P0 — com LLM ollama em loopback
   (TCP local, sem rede externa), servidor MCP fake embutido no binário de
   teste, e turno end-to-end Op→EventMsg→Done via `protocol::Session`.
3. **Worktree por task + checkpoints duráveis** (`ckc`):
   `tools/worktree.rs` (WorktreeManager: create/list/remove, branch
   `ck/task/<id>`, metadados fora do tracking via `.git/info/exclude`) e
   `agent/checkpoint.rs` (CheckpointStore: snapshot git + manifest atômico em
   `.chronokairo/checkpoints.json` com correlação sessão/turno/event-seq;
   sobrevive a `git reset --hard`). Registrados como tools `worktree`/
   `checkpoint` no ToolRegistry e expostos ao desktop por 6 métodos novos no
   `runtime_api`. Testes em `tests/p0_worktree.rs`.
4. **Tela canônica de task supervision**:
   `src/modules/ai/components/TaskSupervisionScreen.tsx` (nav `tasks`) — status
   derivado (running/attention/failed/complete), timeline de eventos, árvore de
   subagentes, approvals inline (allow_once/allow_session/deny), checks,
   arquivos, tokens, diff/patch embutido e worktrees/checkpoints por task.
5. **Distribuição e auto-update** (Tauri): `plugins.updater` com keypair real
   (privada fora do repo, `~/.chronokairo/keys/`), `createUpdaterArtifacts`,
   targets nsis+appimage+deb, plugins updater/process na casca e comandos
   `check_for_updates`/`install_update`.
6. **Manutenção**: ADR_LOG volta a ser índice enxuto — registros
   substantivos viram arquivos numerados; registros correlatos são compactados
   em um único ADR em vez de proliferar arquivos.

## Consequências

- Suite verde: 519 unit + 31 testes de integração Rust (0 warnings na lib),
  typecheck 0 erros, 11 vitest. Cada P0 de fundação passou a ter prova
  executável contra a API pública do `ckc`.
- Os 3 P0s de mercado remanescentes foram fechados; o roadmap segue com os
  itens P1–P3 de `docs/market/TODO.md`.
- Débitos abertos:
  - `cargo check` da casca Tauri no Linux exige `libdbus-1-dev`+`pkg-config`
    (`tao` → `dbus` → `libdbus-sys`); updater validado estruturalmente, compilar
    em Windows/macOS (alvos NSIS) ou após instalar as deps de sistema.
  - Build estático do Tauri (`TAURI_BUILD=true`, `output: export`) é
    incompatível com API routes `force-dynamic` — mover a API para o backend
    hexagonal (ADR-0022) ou excluir as rotas do build Tauri. Blocker do "build
    limpo e reproduzível" do `docs/desktop-gap-analysis-2026.md`.
  - Endpoint de releases do updater (`https://releases.chronokairo.ai/...`) a
    provisionar; assinatura via `TAURI_SIGNING_PRIVATE_KEY_PATH`.
- Histórico completo de changelogs ainda é parcial para cursor (páginas
  antigas), codex web e os produtos só-web (windsurf/factory/amp/kiro/augment).
