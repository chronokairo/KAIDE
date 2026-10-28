# ADR-0027 — Extração do núcleo `ckc` para o repo próprio `chronokairo/cli`

**Status:** Aceito
**Data:** 2026-09-27

## Contexto

A [ADR-0001](./0001-unificacao-monorepo-ai.md) consolidou os repositórios
`chronokairo/cli`, `chronokairo/desktop` e `chronokairo/ai` neste monorepo,
deixando o crate zero-lib `ckc` em `src-tauri/core` como "fonte de verdade"
do Rust, com a casca Tauri (`src-tauri/shell`) consumindo-o por
`path = "../core"`.

Duas pressões pressionam o arranjo:

1. **Ciclo de release acoplado.** Qualquer mudança no núcleo — inclusive as
   correções de segurança e os débitos de paridade de mercado (ADR-0024,
   ADR-0025, ADR-0026) — passa por revisão e build do monorepo `ai` inteiro
   (Next.js + 21 ferramentas absorvidas em `tools/`), mesmo sendo mudança que
   só toca Rust.
2. **Direção de produto.** O `ckc` deixa de ser só o "coding agent do desktop"
   e passa a ser a interface de linha de comando dos produtos Chronokairo
   (AI, platform, BI, CRM, Finance, Legal, People, Projects, Support,
   Marketing). Isso exige um ciclo de release próprio, versionado por tag,
   consumível de forma independente por qualquer repo do ecossistema.

Além disso, `path = "../core"` é intrinsecamente não-publicável: nenhum
consumidor fora do monorepo consegue resolver a dependência.

## Decisão

Extrair o crate `ckc` para o repositório próprio **`chronokairo/cli`**
(`https://gitlab.com/chronokairo/cli`, privado, grupo `chronokairo`).

- **Escopo:** apenas o projeto Rust (`src-tauri/core` → raiz do repo novo).
  `src-tauri/shell` (casca Tauri), `src-tauri/intelligence` (OSINT),
  `tools/`, `mcp/` e `src/` (Next.js) permanecem no `ai`.
- **Histórico:** os 144 commits do antigo `chronokairo/cli` (preservados na
  branch `cli` deste repo desde a consolidação) são a base do repo novo; o
  estado atual do core entra como commit de extração em cima deles. Nenhum
  commit é descartado.
- **Achatamento:** o tree de `main:src-tauri/core` vai para a raiz. O que
  vivia no workspace `src-tauri/` e é necessário ao crate como pacote raiz
  também migra: `[profile.release]` (do `src-tauri/Cargo.toml`) e o
  `.cargo/config.toml` com `rustflags = ["-C", "target-cpu=native"]`.
- **Consumo:** `src-tauri/shell` passa a depender por git com tag:
  `ckc = { git = "https://gitlab.com/chronokairo/cli.git", tag = "v0.1.0" }`.
  O workspace `src-tauri` perde `core` da lista de membros.
- **Identidade:** o binário passa de `ckc` para **`ck`**. O package e a lib
  continuam `ckc` para não quebrar a `git dependency` da casca. Tag inicial:
  `v0.1.0`.
- **Renomeações de superfície:** usage/help, user-agent HTTP
  (`ckc/<version>` → `ck/<version>`) e `serverInfo` do MCP server passam a
  usar `ck`.

## Alternativas consideradas

- **Manter o monorepo e só versionar por tag.** Descartado: não resolve o
  acoplamento de release nem a publicação para consumidores externos.
- **Publicar o `ckc` no crates.io.** Descartado por ora: o crate é
  proprietário e a política zero-lib do projeto torna a crates.io um
  intermediário desnecessário. Reavaliar se o CLI for aberto.
- **Extrair a documentação de mapas (`docs/maps/ckc-*.md`,
  `docs/market/*`) junto com o core.** Descartado neste passo: o escopo
  pedido é o projeto Rust. Os mapas ficam no `ai` com os caminhos corrigidos;
  mover o corpus de análise de mercado para o repo do CLI é decisão
  separada.
- **Desktop falar com o CLI via `ckc app-server` em vez de linkar a crate**
  (é o D04 do `docs/desktop-gap-analysis-2026.md`). Descartado agora: é um
  refactor grande e a `git dependency` já resolve o problema de
  publicação. Registrado como evolução possível.

## Consequências

- O `ckc` tem ciclo de release próprio: tag nova no `chronokairo/cli` +
  bump da `tag` em `src-tauri/shell/Cargo.toml`. Mudança no CLI não exige
  build do Next.js nem das 21 ferramentas de `tools/`.
- **Build do desktop passa a exigir rede** na primeira resolução da
  `git dependency` (o crate fica no cache do Cargo depois). Ambientes
  offline ou builds herméticos precisam de um mirror ou `vendor`.
- Divergência de versão passa a ser explícita: a casca declara a tag que
  consome, então é possível o desktop ficar temporariamente atrás do CLI.
- `docs/desktop-gap-analysis-2026.md` D04 ("extrair core Rust para crate
  versionado") está **parcialmente** resolvido: o crate está versionado, mas
  a casca ainda o **linka** em vez de consumir o `app-server`.
- `cargo check -p chronokairo-desktop` completo continua não executável no
  ambiente Linux de desenvolvimento por dependências de sistema do Tauri
  (`pkg-config`, `gdk-sys`, `libdbus-1-dev`) — débito pré-existente do
  ADR-0024, não introduzido aqui. A resolução da dependência foi validada com
  `cargo metadata` e `cargo check -p ckc`.
