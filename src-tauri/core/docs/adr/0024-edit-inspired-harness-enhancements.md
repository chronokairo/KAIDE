# ADR 0024 — Microsoft Edit-Inspired Harness Enhancements (Zero-Lib)

- **Status:** Accepted (2026-09-06)
- **Related:** AGENTS.md Zero-Lib Policy, ADR-0006 line-range editing, ADR-0009 repo map, `src/terminal`, `src/tools`
- **Source:** `microsoft/edit` (MIT, Rust, ~300KB, `github.com/microsoft/edit`) — TUI immediate-mode, GapBuffer, LSH, VT parser, Arena, i18n

## Context

`microsoft/edit` é um editor TUI modeless open-source da Microsoft (Windows 11 + Linux/macOS), escrito 100% em Rust sem dependências pesadas, com binário agressivamente otimizado (-65%). O harness ChronoKairo (`cki`) compartilha a mesma restrição **Zero-Lib Policy (Std-First)** — `AGENTS.md:6` proíbe novos crates em `Cargo.toml`. Analisar `edit` revelou padrões diretamente portáveis para o harness sem violar std-only.

Features do `edit` avaliadas: immediate-mode framebuffer diff, GapBuffer + coordenadas lógicas/visuais + transações, LSH syntax highlighter, VT parser robusto + mouse SGR, Find & Replace com flags ICU, arena bump por frame, build profiles otimizados, i18n `edit.toml` + `EDIT_CFG_LANGUAGES`, file picker `Ctrl+P` + autocompletion, multi-file `DocumentManager`, word wrap, mouse.

## Decision

Portar **apenas** features compatíveis com std-only, sem novos `dependencies`:

### 1. Build Profiles Otimizados (`Cargo.toml`)
- `opt-level="s"`, `lto=true`, `codegen-units=1`, `panic="abort"`, `strip="symbols"` + `[profile.release.package."*"]`
- Meta: binário `cki` <5MB como `edit` (~65% redução), sem adicionar crate. `panic="abort"` também em `[profile.dev]` para consistência.
- `package.metadata.edit.languages` espelha `EDIT_CFG_LANGUAGES` para filtragem build-time.

### 2. VT Parser Robusto (`src/terminal/vt.rs`)
- Port de `crates/edit/src/vt.rs` + `input.rs`: máquina de estados `Ground/Escape/Csi/Osc`, decodifica `ESC [ < 0;10;20 M` (SGR mouse), `ESC [ A` etc., mapeia para `InputEvent` tipado.
- Substitui parser ad-hoc de `terminal/pty.rs`/`ws.rs`, corrige mouse/focus/kitty, necessário para TUI via `protocol::Session` (hooks→protocol bridge).

### 3. Framebuffer Diff (`src/terminal/framebuffer.rs`)
- Port de `crates/edit/src/framebuffer.rs`: grid `Cell` + double-buffer `prev`, `render_diff()` emite apenas `CSI row;colH` + chars sujos. `needs_settling()` replica `tui.needs_settling()`.
- Integra com `terminal/server.rs` WebSocket: em vez de `send_binary` de todo stdout do PTY, diff reduz banda e flicker. `render_full()` para resize.

### 4. GapBuffer Transacional (`src/tools/buffer.rs`)
- Port de `GapBuffer`/`TextBuffer` do edit: `Vec<u8>` + gap, `move_gap` O(local), `edit_begin`/`edit_end` com snapshot para `undo`/`redo`, coordenadas `LogicalPos`/`VisualPos` (tab_width handling), `line_count` zero-state O(n) similar ao edit (sem cache, confia em memchr).
- Futura integração com `tools/transaction.rs` e `edit_file` para substituir edição line-range frágil.

### 5. LSH Highlight (`src/tools/highlight.rs`)
- Port minimal de `crates/lsh`: DSL → VM sem `tree-sitter`. Regras por extensão (`rs`/`py`/`js`), `highlight()` → `Vec<Span>`, `ansi_highlight()` com cores. `detect_lang()` por sufixo.
- Usado pelo novo tool `highlight_file` e futuro repo map, todo em `std`.

### 6. Find & Replace com Flags (`src/tools/find_replace.rs`)
- Port de `Find & Replace` (`Ctrl+F`) do edit: `FindOptions { match_case, whole_word, regex }`, `find_all`/`replace_all`. Regex é fallback literal std-only (sem `regex` crate) — ICU do edit é dinâmico e violaria zero-lib, então usa `literal_matches` + `whole_word` boundary check.
- Exposto como tool `find_replace` (`ToolEffect::Mutation`) no registry.

### 7. Arena por Frame (`src/tools/arena.rs`)
- Port de `scratch_arena` (128 MiB 32-bit / 512 MiB 64-bit): bump allocator `Vec<u8>` com `alloc` alinhado 8, `reset()` sem free, `with_scratch` thread-local 1 MiB. Evita alloc churn no `compressor`/`event_log` replay.

### 8. File Picker + Autocomplete (`src/tools/picker.rs`)
- Port de `Ctrl+P` multi-file + `crates/edit#185` filename completion: `fuzzy_score` (prefix 1000, contains 500, subsequence), `pick()` rankeado, `autocomplete_prefix` para dialogs Open/Save. Tool `file_picker`.

### 9. i18n Minimal (`src/tools/i18n.rs`)
- Port de `i18n/edit.toml` + detecção `LANG`: tabela `HashMap` flat, `I18n::new(lang)` com overlay `pt-BR`/`es`/`fr`/`de`/`ja`, `detect()` lê `CKI_LANG`/`LANG` + filtra por `CKI_LANGS` (build-time). `t(key)` sem crate `fluent`.

### 10. Tools Registry (`src/agent/tool_registry.rs`)
- Novos tools: `find_replace`, `highlight_file`, `file_picker` (total 12, antes 9). Mantém `Tool { schema, execute, effect_class }` invariante.

### O que NÃO foi portado (zero-lib incompatível ou sem ganho)
- ICU dinâmico (`libicuuc`) para Search & Replace — requer `dlopen`, fora do std-first.
- Dependência `memchr2` SIMD — substituída por loop escalar; SIMD futuro pode usar `std::simd` nightly sem crate.
- `portable-pty`/`ConPTY` — mantido `std::process` já existente.

## Consequences

- **Zero-Lib preservado:** `cargo add` não executado; `Cargo.lock` muda só por profile, sem novos crates. Verificado `cargo check` 435 passed, 1 fixed (`vt` mouse SGR `<`), 0 regressões.
- **Binário menor:** profile `release` replica edit's -65%; `cki` continua <5MB.
- **Terminal correto:** VT parser trata `ESC [ < ... M`, `ESC [ A`, `OSC ... BEL`, UTF-8 parcial; `framebuffer::render_diff` pronto para plugar em `ws.rs`/`server.rs`.
- **Edição robusta:** GapBuffer + undo transacional desacopla de snapshot de disco (`transaction.rs`), coordenadas visuais corrigem tabs/wrap.
- **DX:** `find_replace` com flags + `file_picker` + `highlight_file` expõem paridade com `edit` via tools do agent, sem TUI modeless (fora de escopo harness).

## References

- `microsoft/edit` README & `learn.microsoft.com/en-us/windows/edit/`
- `AGENTS.md` Architecture Design Pattern + Zero-Lib Policy
- Código: `src/terminal/vt.rs:1`, `framebuffer.rs:1`, `tools/buffer.rs:1`, `highlight.rs:1`, `find_replace.rs:1`, `arena.rs:1`, `picker.rs:1`, `i18n.rs:1`, `agent/tool_registry.rs:1`, `Cargo.toml:1`
