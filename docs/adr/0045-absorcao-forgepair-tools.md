# ADR-0045 — Absorção do `forgepair` no Kaide (`tools/forgepair`)

- **Data:** 2026-10-21
- **Status:** Aceito (implementado na `main`)
- **Decisão do proprietário:** absorver o repo `chronokairo/forgepair` para dentro
  do monorepo Kaide, no padrão das absorções anteriores (`tools/*`).

## Contexto

O `forgepair` é um orquestrador de agentes escrito em **Common Lisp**, sem
bibliotecas de terceiros: dois modelos de IA de providers distintos trabalham
junto — um *executor* faz o que foi pedido e um *decider* (meta-agente) decide
se o resultado responde ao pedido. Tinha fonte canônica fora do Kaide, num repo
próprio da org, seguindo o mesmo padrão de `tools/*` já adotado (ADR-0007 a
ADR-0021).

## Decisão

1. **`git filter-repo --to-subdirectory-filter tools/forgepair`** no repo
   original e `git merge --allow-unrelated-histories` no Kaide. Os 15 commits
   entram como segundo pai do merge — histórico integral, com autoria, datas e
   tags originais. É o mesmo método da reabsorção do `company-autopilot`
   (ADR-0044, adendo de 2026-10-21) e do monorepo `erp`.
2. **Sem higiene de conteúdo**: o repo não tinha lockfile com paths locais nem
   segredos no tree. A árvore de `tools/forgepair` (89 arquivos) é idêntica à do
   repo-fonte.
3. **Repo-fonte absorvido e deletado** após a validação: o Kaide passa a ser a
   única fonte. Não há mais `subtree pull` possível.

## Consequências

- `tools/forgepair` é Common Lisp e não participa do workspace npm do Kaide
  (`apps/web` + `sdk/typescript`); é uma ferramenta standalone, como as demais
  em `tools/`.
- O binário é construído por `forgepair.sh`; a configuração local é
  `config.sexp` (exemplo versionado em `config.example.sexp`).
- O histórico do `forgepair` é navegável a partir do Kaide:
  `git log --follow tools/forgepair/README.md`.
