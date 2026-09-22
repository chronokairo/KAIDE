# Gap Analysis — ChronoKairo Coder vs. 2026 Coding Agent Harnesses

**Date:** 2026-08-02  
**Scope:** Comparação funcional real entre o ChronoKairo Coder e os harnesses líderes de agosto 2026: Claude Code, Codex CLI, Antigravity, Cursor Agent, Aider.

> **Status (2026-08-06):** Todos os gaps P0 e P1 do roadmap abaixo foram implementados (edit_file, multi_edit_file, approval wired, sub-agentes `task`, MCP, context compaction, token counting, repo map, AGENTS.md, streaming deltas, session persistence) **e os itens "Next" também** (custo em US$, web_search/http_fetch, lint gate, todo tool, memória vetorial via embeddings no inferencer local, remoção de redundâncias). Ver seção "Next" no fim do roadmap.

---

## Executive Summary

O ChronoKairo Coder tem uma base sólida com roteamento multi-provedor, fallback por tier, transações de workspace, e loop de tool-use competitivo. Porém, está **2-3 gerações atrás** dos líderes em áreas críticas: edição de código, sub-agentes, memória persistente, MCP, e observabilidade. Os gaps mais impactantes para SWE-bench performance são: (1) ausência de edição cirúrgica por linha, (2) nenhum sub-agente, (3) nenhum mecanismo de contexto inteligente.

> [!CAUTION]
> O approval broker está **definido nos tipos mas não está wired** — writes e commands executam sem pedir aprovação. Isso é um gap de segurança crítico.

---

## 1. Tool Inventory — Gap Comparison

| Tool / Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor | Aider |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Read file** | ✅ | ✅ | ✅ | ✅ (line ranges) | ✅ | ✅ |
| **Write file** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Line-range edit** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Multi-edit (non-contiguous)** | ✅ | ✅ | ❌ | ✅ | ✅ | ❌ |
| **Diff/patch application** | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ |
| **Exact string replace** | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Shell execution** | ✅ | ✅ | ✅ (sandbox) | ✅ | ✅ | ✅ |
| **Grep/ripgrep search** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Glob/file search** | ⚠️ (list_tree) | ✅ | ❌ | ✅ | ✅ | ❌ |
| **List directory** | ✅ | ✅ | ✅ | ✅ (files+dirs) | ✅ | ❌ |
| **Symbol search** | ⚠️ (regex repo map) | ✅ (LSP) | ❌ | ❌ | ✅ (LSP) | ✅ (tree-sitter) |
| **Web search** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **HTTP fetch** | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| **Image generation** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Git operations** | ⚠️ (status/diff/log/stash) | ✅ | ✅ | ✅ (via shell) | ✅ | ✅ (native) |
| **Task/TODO tracking** | ✅ (sub-agent `task`) | ✅ | ❌ | ❌ | ❌ | ❌ |
| **Notebook editing** | ❌ | ✅ | ❌ | ❌ | ✅ | ❌ |
| **Background tasks** | ❌ | ❌ | ✅ (cloud) | ✅ | ✅ | ❌ |
| **Timers/cron** | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |

### ✅ Resolvido: Edição de Código

Implementado em `src/tools/fs.rs` + dispatch em `src/agent/agent_loop.rs`:
- **`edit_file(path, start_line, end_line, old_content, new_content)`** — line-range anchoring
- **`multi_edit_file(path, edits[])`** — edições não-contíguas em uma chamada
- **`replace_exact`** — mantido como fallback para match exato único

`replace_exact` segue como fallback, mas o prompt do coder agora prioriza `edit_file`.

---

## 2. Agent Architecture

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor | Aider |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Sub-agent spawning** | ✅ (`task`) | ✅ | ✅ (cloud) | ✅ | ✅ (8x) | ❌ |
| **Parallel agent execution** | ⚠️ (1 sub-agent/turn) | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Custom agent types** | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ (arch/edit) |
| **Architect/Editor split** | ⚠️ (planner) | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Tool-use loop** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Planner fallback** | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| **Max iterations** | 128 | ~200 | ~100 | ~200 | ~100 | Unlimited |
| **Parallel read tools** | ✅ (4) | ✅ | ✅ | ✅ | ✅ | ❌ |

### ✅ Resolvido: Sub-Agentes

Tool `task` implementado em `src/agent/agent_loop.rs:1006` — spawna um segundo loop (`run_agent_loop_with_hooks`) em thread própria com timeout de 300s. Ainda **sequencial** (1 por turno); paralelismo múltiplo fica como next-step.

---

## 3. Context Management

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor | Aider |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Max context** | 128K | 1M | 200K | 2M | 200K | Model-dep. |
| **Context compaction** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Conversation summary** | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ |
| **Repository map** | ✅ (regex) | ❌ | ❌ | ❌ | ✅ | ✅ |
| **File checksums** | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **Token counting** | ✅ (estimate) | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Smart file selection** | ⚠️ (repo map) | ✅ | ❌ | ❌ | ✅ | ✅ (repo map) |

### ✅ Resolvido: Context Intelligence

- **Compactação**: `maybe_compact` quando `estimated_tokens > 0.8 * max_context` (`src/agent/agent_loop.rs:292`)
- **Sumarização**: via `summarizer_model`, guardada como system record
- **Repo map**: `RepoMapGenerator` (regex, 2KB) injetado no system prompt (`src/llm/prompt.rs:75`)
- **Token counting**: `ShortTermMemory::estimated_tokens` + evento `TokenUsage` por chamada

---

## 4. Permission & Safety

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor |
|---|:---:|:---:|:---:|:---:|:---:|
| **Per-tool approval** | ✅ (Ask/Deny/Allow wired) | ✅ | ✅ (modes) | ✅ | ✅ |
| **Sandbox isolation** | ❌ (transação+rollback) | ❌ | ✅ (kernel) | ✅ (cloud) | ❌ |
| **Path-scoped perms** | ❌ | ✅ | N/A | ✅ | ❌ |
| **Network policy** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Command prefix match** | ✅ | ✅ | N/A | ✅ | ✅ |
| **Persistent settings** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Pre-tool hooks** | ✅ (AgentHooks) | ✅ | ❌ | ❌ | ❌ |

### ✅ Resolvido: Approval Broker Conectado

`require_approval()` (`src/agent/agent_loop.rs:227`) é chamado para write/edit, run_command, run_tests, git e MCP tools; `on_approval` callback + `blocked_actions` auditado no resultado final.

---

## 5. Memory & Persistence

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor | Aider |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Short-term memory** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Long-term memory** | ✅ (SQLite sessions) | ✅ (CLAUDE.md) | ❌ | ✅ (transcripts) | ✅ (memories) | ❌ |
| **Project context files** | ✅ (AGENTS.md/CLAUDE.md/.cursorrules) | ✅ (CLAUDE.md) | ❌ | ✅ (AGENTS.md) | ✅ (.cursorrules) | ❌ |
| **Session persistence** | ✅ (persist/resume) | ✅ | ✅ | ✅ | ✅ | ✅ (git) |
| **Vector/semantic search** | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Episodic memory** | ⚠️ (transcript store) | ❌ | ❌ | ❌ | ✅ | ❌ |

### ✅ Resolvido: Memória de Projeto

`CoderPrompt::load_project_context` lê `AGENTS.md`, `CLAUDE.md`, `.cursorrules`, `CONTEXT.md` e injeta no system prompt junto do repo map.

---

## 6. Verification & Testing

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor | Aider |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| **Auto-detect test cmd** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Run after mutations** | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Lint integration** | ❌ | ✅ | ❌ | ✅ (IDE) | ✅ (LSP) | ✅ |
| **Retry on failure** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Rollback on failure** | ✅ | ❌ | ✅ (sandbox) | ❌ | ✅ | ✅ (git) |
| **Adversarial verify** | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |

O ChronoKairo é competitivo aqui. Auto-detecção de test command + retry + rollback é forte.

---

## 7. LLM Integration

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Aider |
|---|:---:|:---:|:---:|:---:|:---:|
| **Multi-provider** | ✅ | ❌ (Anthropic) | ❌ (OpenAI) | ❌ (Google) | ✅ (70+) |
| **Same-tier fallback** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Retry with backoff** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Streaming** | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Streaming tool deltas** | ❌ | ✅ | ✅ | ✅ | ❌ |
| **Cost tracking** | ❌ | ✅ | ✅ | ❌ | ✅ |
| **Token counting** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Extended thinking** | ❌ | ✅ | ✅ (o3/o4) | ❌ | ❌ |
| **Local GGUF inference** | ✅ | ❌ | ❌ | ❌ | ❌ |

O ChronoKairo tem vantagens únicas: multi-provider routing, same-tier fallback, e inferência GGUF local. Nenhum concorrente tem os três.

---

## 8. Extensibility

| Capability | ChronoKairo | Claude Code | Codex CLI | Antigravity | Cursor |
|---|:---:|:---:|:---:|:---:|:---:|
| **MCP client** | ✅ (stdio) | ✅ | ✅ | ✅ | ✅ |
| **Plugin/skill system** | ❌ | ✅ (skills) | ❌ | ✅ (skills) | ✅ (ext.) |
| **Custom tool defs** | ❌ | ✅ | ❌ | ❌ | ❌ |
| **Hooks/events** | ✅ (AgentHooks) | ✅ (PreToolUse) | ❌ | ❌ | ❌ |
| **Config files** | ⚠️ (env only) | ✅ (.claude/) | ✅ | ✅ (.gemini/) | ✅ (.cursor/) |

---

## Priority Ranking — What to Fix First

### 🔴 P0 — Bloqueadores (todos resolvidos em 2026-08-06)

| # | Gap | Impact | Status |
|---|-----|--------|--------|
| G1 | **Sem edição cirúrgica (line-range edit)** | Crítico | ✅ `edit_file` + `multi_edit_file` |
| G2 | **Approval broker não wired** | Segurança | ✅ `require_approval` em todos os tools |
| G3 | **Sem context compaction** | Performance | ✅ `maybe_compact` no loop |
| G4 | **Sem token counting** | Ops | ✅ `estimated_tokens` + `TokenUsage` |

### 🟡 P1 — Importantes para competitividade (resolvidos, exceto G6)

| # | Gap | Impact | Status |
|---|-----|--------|--------|
| G5 | **Sem sub-agentes** | Throughput | ✅ tool `task` |
| G6 | **Sem cost tracking** | Ops | 🟡 tokens ✅; custo US$ pendente |
| G7 | **Sem MCP client** | Extensibilidade | ✅ `src/mcp/` |
| G8 | **Sem project context (AGENTS.md/CLAUDE.md)** | Quality | ✅ `load_project_context` |
| G9 | **Streaming tool deltas** | UX | ✅ `ToolCallDelta` |
| G10 | **`list_files` não lista diretórios** | Quality | ✅ `list_tree` |

### 🟢 P2 — Nice-to-have

| # | Gap | Impact | Status |
|---|-----|--------|--------|
| G11 | Sem repo map | Context efficiency | ✅ regex-based, 2KB |
| G12 | Sem lint integration | Edit quality | ❌ pendente |
| G13 | Sem web search | Research capability | ❌ pendente |
| G14 | Sem session persistence | UX | ✅ persist/resume |
| G15 | Sem background tasks | UX | ❌ pendente |
| G16 | Sem git branch/stash | Workflow | ✅ stash/log/restore |

---

## Competitive Position Matrix

```
                    Edição   Sub-agents   Context    Safety    Memory   MCP    Local LLM
Claude Code         ██████   ██████       ██████     █████░    █████░   █████░   ░░░░░░
Codex CLI           ████░░   █████░       ████░░     ██████    ███░░░   █████░   ░░░░░░
Antigravity         ██████   ██████       ██████     ██████    █████░   ██████   ░░░░░░
Cursor              ██████   ██████       █████░     ████░░    ██████   █████░   ░░░░░░
Aider               ████░░   ██░░░░       ████░░     ████░░   ███░░░   ░░░░░░   ░░░░░░
─────────────────────────────────────────────────────────────────────────────────────────
ChronoKairo           ██████   ████░░       █████░     █████░   ████░░   █████░   ██████
```

---

## ChronoKairo Unique Strengths

Áreas onde o ChronoKairo é **melhor ou igual** aos líderes:

1. **Multi-provider routing** — nenhum líder faz roteamento entre providers com fallback por tier
2. **Local GGUF inference** — único harness com engine de inferência local embutido
3. **Same-tier automatic fallback** — `ModelTier` classification é exclusivo
4. **Workspace transactions** — rollback determinístico; Codex usa sandbox, Claude Code não tem rollback
5. **Planner fallback** — funciona com modelos sem tool-calling (útil para modelos locais menores)
6. **Verification gate** — auto-detecção de test command com retry é competitivo

---

## Recommended Roadmap

> Checkboxes marcados em 2026-08-06 — já implementados e verificados no código.

### Sprint 1 (1-2 dias) — Quick Wins
- [x] **G2**: Wire approval broker — `AgentHooks.require_approval` no dispatch de todos os tools (`src/agent/agent_loop.rs`)
- [x] **G8**: Ler `AGENTS.md`/`CLAUDE.md` no system prompt — `CoderPrompt::load_project_context` (`src/llm/prompt.rs`)
- [x] **G10**: `list_files` incluir diretórios — tool `list_tree` com depth/max_entries
- [x] **G6**: Cost tracking — token counting (in/out/reasoning) + evento `TokenUsage` + custo em US$ via catálogo models.dev

### Sprint 2 (3-5 dias) — Edição
- [x] **G1**: Implementar `edit_file` com line-range anchoring — `tools/fs.rs` + dispatch (`src/agent/agent_loop.rs:858`)
- [x] Adicionar `multi_edit_file` para edições não-contíguas — schema `edits[]` + `fs::multi_edit_file`
- [x] Manter `replace_exact` como fallback — mantido; prompt (`prompts/coder.txt`) agora prioriza `edit_file`

### Sprint 3 (1 semana) — Context Intelligence
- [x] **G4**: Token counting — `ShortTermMemory::estimated_tokens` + `context_compact_threshold`
- [x] **G3**: Context compaction — `maybe_compact` via summarizer quando `tokens > 0.8 * max_context`
- [x] **G11**: Repo map — `RepoMapGenerator` (regex, max 2KB) injetado no system prompt

### Sprint 4 (1-2 semanas) — Architecture
- [x] **G5**: Sub-agent mínimo — tool `task` (`src/agent/agent_loop.rs:1006`), timeout 300s
- [x] **G9**: Streaming tool deltas — `ToolCallDelta` + `on_tool_call_delta`
- [x] **G7**: MCP client — `src/mcp/` (stdio transport), tools mergeados e gate por política
- [x] **G14**: Session persistence — `persist_session`/`resume_session` (SQLite, crash-safe)
- [x] **G16**: Git operations — status/diff/log/stash/restore em `src/tools/git.rs`

### Next — itens restantes (P2 / incremental)
- [x] **Custo em US$**: `LlmRouter::estimate_cost` usa preços $/MTok do catálogo models.dev (por base id, preferindo o provider ativo); acumulado em `AgentState.turn_cost_usd`, mostrado na nota `[usage]` e no resumo final
- [x] **Web search / HTTP fetch tool**: `http_fetch` (reqwest, HTML→texto, cap de bytes) + `web_search` (SearXNG via `WEB_SEARCH_URL` com fallback DuckDuckGo, sem API key) em `src/tools/web.rs`, ambos com gate de approval
- [x] **Lint gate**: `cargo clippy` roda junto do gate de testes após mutação (`Config.lint_on_mutation`, env `LINT_ON_MUTATION`)
- [x] **TODO tracking tool**: tool `todo` (add/complete/remove/clear/list) com estado em `AgentState.todos`; itens pendentes listados no resumo final
- [x] **Memória vetorial/semântica**: `InferenceEngine::embed` (pooling last-token + L2 normalize, via `emb_buf`), `Embedder` lazy em `src/llm/embedder.rs`, download via `--download-embedding-model` (Qwen3-Embedding 0.6B Q8), tabela `memory_vectors` (BLOB) + busca cosseno em `memory/log.rs`, tool `memory_search`, auto-index em `persist_session` (off por padrão, `MEMORY_INDEXING=true`)
- [x] **Limpou redundância**: `run_plan_mode` removido, `git_init` step removido
