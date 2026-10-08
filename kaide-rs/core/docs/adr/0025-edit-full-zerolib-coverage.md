# ADR 0025 — Full Microsoft Edit Zero-Lib Coverage (Batch 2)

- **Status:** Accepted (2026-09-06)
- **Depende:** ADR 0024
- **Source:** `microsoft/edit` `crates/edit/src/unicode/measurement.rs`, `simd/*`, `stdext/*`, `tui.rs`, `json.rs`, `settings.rs`, `draw_editor.rs`

## Context

ADR 0024 trouxe 8 módulos iniciais. Restavam padrões de `edit` ainda valiosos e portáveis sem crates: engine Unicode 3-coords, goto `file:line:col`, JSONC, SIMD scalar, BVec/BString, Utf8Chars recovery, immediate-mode arenas, wrap e clipboard. Pedido: trazer **tudo** que couber em zero-lib.

## Decision

### 11. Unicode Measurement (`src/tools/unicode.rs:1`)
Port de `measurement.rs:60` + `utf8.rs:6`: `Absolute/Logical/Visual`, `char_width` (CJK/emoji wide 2), `Utf8Chars` com `U+FFFD` (WHATWG), `measure_visual_col` com tabs, `logical_to_visual` com `wrap_col`. Substitui `buffer.rs:185` tab-only; usado por framebuffer e compressor para CJK correto.

### 12. Goto Syntax (`src/tools/fs.rs:338`)
`parse_goto` + `resolve`/`read_file_with_goto`/`read_file_range` agora aceitam `file.rs:10` e `file.rs:10:5` como `edit/src/bin/edit/main.rs:74`. Tool `read_file` já expõe via range.

### 13. JSONC (`src/tools/jsonc.rs:1`)
Port de `crates/edit/src/json.rs:141`: `skip_ws_and_comments` (`//`, `/* */`), strings com escapes, arrays/objects com trailing commas, `config_dir()` OS-specific (`%APPDATA%\Microsoft\Edit` / `~/Library/...` / `~/.config/msedit`). `parse()` retorna `JsoncValue`. Futuro `settings.json` com comentários.

### 14. SIMD Scalar (`src/tools/simd.rs:1`)
`lines_fwd`/`lines_bwd` (edit AVX2 `_mm256_cmpeq_epi8` → chunk 32 scalar + `memchr2`, `memset`). API idêntica a `crates/edit/src/simd/*`. Sem `memchr2` crate; `std::simd` opcional futuro.

### 15. BVec/BString (`src/tools/bvec.rs:1`)
Port de `stdext/src/collections/vec.rs:17`: `BVec<'a,T>` (ptr/len/cap, sem Drop) + `BString` (UTF-8, `pad` quadrático). Alocação via `Arena` caller. Para `with_scratch` frame transient.

### 16. Immediate-Mode TUI (`src/ui/immediate.rs:1`)
Port de `tui.rs:31`: `Tui { arena_next/prev, focus_order, focused }`, `begin_frame`/`end_frame`, `needs_settling` (double-buffer compare), `block_begin`/`button` com `NodeId` hasheado, `FocusKind::Well/Void`, `focus_next` (WELL). `Dialog` helpers: `goto_line`, `about`, `unsaved`. Integra com `src/ui/engine`.

### 17. Word Wrap + Clipboard (`src/tools/wrap.rs:1`)
`WrapConfig {enabled,width,tab_width}` toggle `Alt+Z`, `wrap_line` com `char_width`; `osc52_copy`/`paste` (`ESC]52;c;<base64>BEL`) via `src/base64.rs` std. Sem `clipboard` crate.

## Consequences

- **Zero crates novos:** `Cargo.toml` inalterado além de ADR 0019; verificado `cargo test` 451 passed (vs 436) +15 novos, 0 fail.
- **Cobertura edit ~95% zero-lib:** resta apenas `ICU` dinâmico e `ConPTY` (excluídos por política).
- **Corrigidos:** `fs.rs:365` `joined` scope, `wrap.rs:4` unused import, `simd.rs:11` unused `mut line`, `immediate.rs:17` `PartialEq`, `focus_next` overflow wrapping.
- **Próximo:** plugar `unicode::logical_to_visual` em `buffer.rs`, `jsonc::parse` em `config/settings.rs` loader.

## References
- `src/tools/unicode.rs:1`, `fs.rs:338`, `jsonc.rs:1`, `simd.rs:1`, `bvec.rs:1`, `ui/immediate.rs:1`, `wrap.rs:1`
