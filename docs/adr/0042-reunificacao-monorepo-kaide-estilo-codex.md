# ADR-0042 — Reunificação do monorepo Kaide no layout de `openai/codex` (reversão da ADR-0027) + rebrand `ck` → `kaide`

- **Data:** 2026-10-08
- **Status:** Proposto (branch `chore/codex-monorepo-layout`, sem merge; consolidação permanece em branch até revisão)
- **Nome:** **Kaide** = Kairos Code + AI + IDE. Onde o Codex tem `codex-rs/` / `codex-cli`, aqui é `kaide-rs/` / SDK `kaide`.

## Contexto

- A [ADR-0001](./0001-unificacao-monorepo-ai.md) unificou `cli + desktop + ai` num monorepo (núcleo `ckc` em `src-tauri/core` + casca Tauri + Next).
- A [ADR-0027](./0027-extracao-core-ckc-para-repo-cli.md) extraiu o `ckc` para o repo próprio `chronokairo/cli` (release acoplado, `path = "../core"` não-publicável, `ck` como CLI de todos os produtos; consumo por `git tag v0.1.0` via GitLab).
- Decisão do proprietário (2026-10-08): reunificar `ai + cli` num monorepo só, organizado com a pegada de `openai/codex`, e rebatizar o produto/repo para **Kaide**.

## Decisão

Layout (espelho de `openai/codex` → Kaide):

```text
kaide/                          # raiz do monorepo (package.json workspaces npm)
├── apps/web/                   # Next.js (era a raiz: src/, public/, next.config.mjs, scripts/)
├── apps/desktop/               # app Tauri (era src-tauri/: tauri.conf.json, icons/, capabilities/)
├── kaide-rs/                   # workspace Cargo (espelho de codex-rs/)
│   ├── core/                   # crate zero-lib `ckc`, vendirado de chronokairo/cli
│   ├── shell/                  # casca Tauri (path ../core, era git-tag)
│   └── intelligence/           # harness OSINT (sem dependência do core)
├── sdk/typescript/             # @chronokairo/kaide-sdk — wrapper bin `kaide` (espelho de codex-cli/)
├── tools/, mcp/, docs/, scripts→apps/web/scripts, supabase/
```

- **Vendoring com histórico preservado:** `kaide-rs/core` copia `src/, tests/, bench/, docs/, prompts/, sandbox/, build.rs, Cargo.toml, README.md, TODO.md` do `chronokairo/cli`; o repo `cli` continua existindo (fonte/GH). Sem `git subtree` — reintegração por cópia + esta ADR.
- **npm, não pnpm:** o Codex migrou para pnpm; aqui o AGENTS.md exige lint/typecheck/testes/build via **npm**, então a raiz usa `workspaces` do npm (`apps/web`, `sdk/typescript`). Divergência consciente.
- **Rebrand mínimo e reversível:** diretório `kaide-rs/`, binário `ck` → `kaide` (`[[bin]]`, help `Usage:`, `clientInfo`/`serverInfo` MCP), `productName` Tauri → `Kaide`, `identifier` → `com.chronokairo.kaide`. **Mantidos de propósito:** lib `ckc` (6 arquivos `p0_*` + `pub use ckc` na shell dependem dela), pacote npm `@chronokairo/ai`, `productName` no updater endpoint.
- **Paths atualizados:** `shell` consome `ckc = { path = "../core" }`; `tauri.conf.json`: `frontendDist` `../out` → `../web/out`, `beforeDev/BuildCommand` → `npm --prefix ../web run dev|build`; `.gitignore`: `src-tauri/target/` → `kaide-rs/target/` (demais padrões já valem em qualquer nível).

## Consequências / débitos (follow-ups, fora deste branch)

1. Renomear o repo GitHub `chronokairo/ai` → `chronokairo/kaide` (`gh repo rename kaide`; GitHub redireciona o nome antigo; atualizar remoto GitLab e a descrição "migrated from GitLab").
2. Renomear lib `ckc` → `kaide` (todos os `use ckc::` nos `p0_*`, `pub use ckc`, `src-tauri` docs/mapas `docs/maps/ckc-*.md`).
3. Renomear pacote npm `@chronokairo/ai` → `@chronokairo/kaide` (conferir consumidores via `github:chronokairo/ai`).
4. Troca do `identifier` invalida a cadeia do updater para installs existentes (reinstalar); endpoint `releases.chronokairo.ai` inalterado.
5. Release do núcleo volta a andar com o monorepo (motivo original da ADR-0027) — mitigar com versionamento por crate + CI por path (`kaide-rs/**` vs `apps/**`).
6. SDK real (client TS do `app-server` headless) sobre o scaffold de `sdk/typescript`; `sdk/python` quando houver cliente.
7. `node_modules/`, `.next/`, `out/` e `kaide-rs/target/` na raiz antiga são artefatos ignorados — reinstalar em `apps/web` (`npm install`) e rebuildar Rust no novo path.
