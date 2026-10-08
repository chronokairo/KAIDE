# @chronokairo/kaide-sdk

Wrapper TypeScript do **Kaide** — espelho do `codex-cli/` do `openai/codex`.

- `bin/kaide.js` — resolve o binário `kaide` (`KAIDE_BIN` → `kaide-rs/target/debug|release/kaide` → PATH) e repassa argv. Equivale ao `npm install -g @openai/codex` → binário Rust.
- `bin/kaide-desktop.js` — atalhos `desktop:dev` / `desktop:build` (Tauri em `apps/desktop`, CLI via `apps/web`).
- `apps/web/src/index.ts` — `resolveKaideBin()` para consumo programático.

Compile o núcleo com `cargo build --manifest-path kaide-rs/Cargo.toml -p kaide --bin kaide`.

Scaffold inicial — ver [ADR-0042](../../docs/adr/0042-reunificacao-monorepo-kaide-estilo-codex.md). Não publica no npm (privado).
