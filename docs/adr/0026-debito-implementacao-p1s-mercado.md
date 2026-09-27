# ADR-0026 — Débito: implementação dos 15 P1s de mercado com testes e validação via NVIDIA NIM

**Status:** Proposto (débito)
**Data:** 2026-09-26

## Contexto

O backlog P1 de paridade com o mercado (`TODO.md` → "P1 — Coding agent de
mercado", detalhe em `docs/market/TODO.md`) tem 15 itens validados contra os
changelogs de set/2026. Cada um tem base parcial no `ckc` (aprovada pelos
testes de integração do ADR-0024) e precisa de implementação com prova de
teste. Para as capacidades que dependem de LLM (classificador de risco, evals
de skill, sumarização de compaction), a validação live usará o NVIDIA NIM
configurado no ProviderStore (`providers::store`), com os testes unitários
rodando sempre em modo determinístico (loopback/heurística), sem rede.

## Decisão

Registrar como débito de implementação, um item = código + testes no `ckc`:

- **A1** classificador de risco no approval gate (heurística determinística +
  LLM 1-token via NIM, evidência persistente que sobreviva a compaction,
  invalidação de aprovação ao ampliar permissões).
- **A2** governança de subagentes: sem aninhamento por padrão, permissões
  próprias, allowlist de tools por subagente, caps de concorrência/spawns.
- **A3** compaction econômica: microcompactação preservando prefixo do
  prompt-cache, resume por boundary de compaction, checkpoint no compaction,
  modelo dedicado configurável (`Config::compaction_model`).
- **A4** cliente MCP 2026-07-28: tool search paginado/deferred, startup não
  bloqueante, `output_token_limit` por tool, abort signals, OAuth com refresh
  (RFC 9207/CIMD) para servidores HTTP.
- **A5** sandbox fail-closed: mascaramento de credenciais no egress
  (JWT/SigV4/AWS), regra "containment escape", rede imposta em redirects/WS.
- **B1** ACP como porta universal: adapter ACP server sobre `Op`/`EventMsg` +
  `AcpClient` para consumir harnesses externos.
- **B2** daemon app-server: lifecycle (auto-start, heartbeat), sessões
  compartilhadas TUI/IDE/desktop via socket.
- **C1** console de supervisão/fleet no desktop (kanban de sessões, stop de
  subagente, milestones) sobre o runtime_api.
- **C2** UX de checkpoints: verificação de backup antes de restaurar,
  navegação prev/next, "view changes" contra o checkpoint.
- **D1** fila durável de tasks (journal/WAL que sobrevive a restart).
- **D2** gatilhos event-driven: `TriggerSource` (PR watch GitHub/GitLab/etc.,
  agendamentos) alimentando a fila D1.
- **E1** supply-chain de skills: pin sha256 em lockfile, validação de
  manifesto, verificação de integridade no load, evals pontuados.
- **E2** managed settings fail-closed: políticas geridas só apertam
  (`availableModelsMatch: "exact"`, `deniedModels`, sandbox floor).
- **E3** segredos/arquivos sensíveis: aprovação explícita para `.env`/chaves/
  certificados, fim do dotenv automático, redaction em telemetria/logs.

Testes: cada item ganha unidade (determinística) + integração em
`src-tauri/core/tests/` seguindo o padrão `p0_*` (loopback, sem rede);
os LLM-dependentes ganham `#[ignore = "live"]` executáveis contra o NIM
configurado. Validação completa: `cargo test` + `npm typecheck` + `vitest`.

## Consequências

- Ordem sugerida por aproveitamento de base: E2 → E3 → E1 → A5 → A2 → A1 →
  A3 → D1 → D2 → C2 → A4 → B2 → B1 → C1.
- MVPs primeiro (cada item entregável sem bloquear os demais); itens marcados
  "refina X" executados junto ao documento de origem (desktop-gap/adr-0015).
- Ao concluir cada item: marcar em `TODO.md`, mover para o `CHANGELOG.md` e
  atualizar o débito aqui.
