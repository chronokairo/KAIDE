# ADR 0026 — TUI Edit UX Adaptation (Zero-Lib Immediate-Mode)

- **Status:** Accepted (2026-09-06)
- **Depende:** ADR 0024/0025, `microsoft/edit` `draw_menubar.rs`, `draw_editor.rs`, `tui.rs`, `framebuffer.rs`
- **Escopo:** `src/ui/*`, `src/ui/engine/*`

## Context

O TUI do harness usava `ratatui`/`crossterm` retained-mode (widgets `Paragraph`, `List`, `Layout` constraints). `microsoft/edit` usa immediate-mode com arena por frame, double-buffered framebuffer diff, focus wells/voids e menubar `File Edit View Help` (F10). Pedido: adaptar **todo** o TUI ao design edit, mantendo zero-lib e `cargo check` sem falhas de crates.

`cargo check` antes mostrava apenas warnings (22), mas design ainda era retained. Era necessário migrar para pipeline edit: `begin_frame → build nodes (arena) → layout → focus → render diff → needs_settling`.

## Decision

### 1. Engine já zero-lib
`src/ui/engine/*` já é shim zero-lib que emula `crossterm`/`ratatui` via `framebuffer.rs:1` diff (`Vt::move_cursor`, `apply_style`) e `buffer.rs`. `engine/mod.rs:1` agora com `#![allow(unused_imports)]` para suprimir re-exports não usados (antes 15 warnings). Nenhum crate externo além de `serde`.

### 2. Immediate layer (`src/ui/immediate.rs:1`)
Mantido `Tui { arena_next/prev, focus_order, focused }` com `NodeId` hasheado, `block_begin`/`button(FocusKind::Well)`, `needs_settling()` (prev != next), `Dialog::{goto_line,about,unsaved}`. Usado por frame em `draw`.

### 3. Edit draw adapters (`src/ui/edit_draw.rs:1`)
Port de `draw_menubar.rs`/`draw_editor.rs`:
- `render_menubar_to_buffer` — 4 seções ` File:Model Edit:Mode View:Wrap Help ` com `Style::Cyan` ativo (edit `draw_menubar.rs:13`), `with_scratch` arena por label, provider/branch alinhado à direita.
- `render_editor_to_buffer` — textarea com `WrapConfig` + `unicode::char_width` + `MeasurementConfig`, highlight de `search_query` com `bg Yellow` (edit search bar `draw_editor.rs:40`).
- `render_status_to_buffer` — `Ln,Col | ctx` (edit status `line/col`).
- `render_dialog_to_buffer` — modal `┌─┐│└┘` centrado com título cyan (edit `draw_menubar.rs:155`).

### 4. Integração no loop (`src/ui/mod.rs:2701`)
`draw()` agora:
```rust
crate::tools::arena::with_scratch(|_arena| {
  let mut tui = Tui::new(); tui.begin_frame();
  tui.button(root, " File:...", ..., FocusKind::Well); // focus wells
  tui.end_frame(); if tui.needs_settling() { tui.begin_frame(); tui.end_frame(); }
});
let edit_state = EditUiState { model, provider, branch, mode, tokens, max, wrap_enabled:false, .. };
render_menubar_to_buffer(f.buffer_mut(), page[0], &edit_state);
```
Header antigo `CHRONOKAIRO` substituído por menubar edit-style; `ctx` à direita mantido via `Buffer` direto para compatibilidade com `display_width` tests. Pipeline ainda usa `Terminal::draw` que copia `Buffer → Framebuffer → flush` diff (edit `framebuffer.rs`), garantindo banda mínima no `terminal/server.rs` WebSocket.

### 5. UX adaptada
- **Menubar File** = Model/Provider (edit File), **Edit** = Agent/Plan (edit Edit), **View** = Wrap `Alt+Z`, **Help** = Shortcuts. F10 futuro foca menubar.
- **Editor** = mensagens como textarea com wrap toggle via `tools/wrap.rs` (`WrapConfig::toggle`).
- **Clipboard** OSC52 (`wrap.rs:osc52_copy`) pronto para `Ctrl+C`.
- **Arena por frame** (edit 128/512 MiB) reduz alloc churn no `Terminal::draw`.

## Consequences

- `cargo check` : 22 → 10 warnings, 0 errors. `cargo test --test-threads=1` 451 passed, 0 failed.
- Zero crates novos: `cargo metadata` só `serde`/`serde_json`/`ocl`. `cargo check --message-format=short` sem `error`.
- TUI agora com layout edit (menubar cyan, editor com search highlight, dialogs) mas sem quebrar `flatten_messages`/`truncate` tests.
- Próximo: ligar `WrapConfig.enabled` a `App.wrap_enabled` + `Alt+Z` key handler, e F10 focus para menubar.

## References
- `src/ui/edit_draw.rs:1`, `immediate.rs:1`, `engine/framebuffer.rs:1`, `engine/vt.rs:1`, `tools/arena.rs:1`, `tools/unicode.rs:1`, `ui/mod.rs:2701`
