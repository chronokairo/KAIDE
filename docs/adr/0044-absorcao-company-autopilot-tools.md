# ADR-0044 — Absorção do `company-autopilot` no Kaide (`tools/company-autopilot`)

- **Data:** 2026-10-08
- **Status:** Aceito (implementado na `main`)
- **Decisão do proprietário:** absorver o repo `chronokairo/company-autopilot`
  (agentes operacionais, NVIDIA NIM, backends ACP, rotinas diárias) para dentro
  do monorepo Kaide, no padrão das absorções anteriores (`tools/*`, ADRs
  0007–0021).

## Contexto

O `company-autopilot` concentrava os agentes de operação da empresa virtual
(.agent.md full-team/minimal-team, scripts Python `acp.py`, `company.py`,
`sales.py`, `night_sales.py`, `crm_sync.py`, syncs Supabase, ADRs próprias
0001–0004) com fonte canônica fora do Kaide. Direção oposta à cogitada antes
(TOTVS para lá, ADR-0043): o autopilot vem para cá.

## Decisão

1. **`git subtree add -P tools/company-autopilot` do branch
   `ck/minimal-team-madrugada` (`cc7ddbd`, 38 commits, histórico integral)** —
   estado mais recente (equipe mínima da madrugada + vault + bindings de setor),
   à frente da `main` do repo-fonte.
2. **Higiene na absorção:** removido `acp-adapters/package-lock.json` com paths
   locais (`file:../../../Documents/...`) — regenerar com `npm install` no dir
   se os adapters ACP forem usados; sem segredos no tree (varredura: só regexes
   de detecção em `migrate_audiomed.py`/`sync_knowledge.py`, nenhum valor).
3. **Bloco de diretriz UI-hexagonal** (diferença não commitada do repo-fonte)
   aplicado à cópia absorvida, igual às demais `AGENTS.md`.
4. **Repo-fonte absorvido e deletado** (ver Adendo): Python validado com
   `py_compile`; sem acoplamento com o web (tools standalone, como as demais).

## Consequências / débitos (originais, mantidos)

## Adendo (2026-10-08)

Os repos-fonte `chronokairo/cli` e `chronokairo/company-autopilot` foram
**deletados no GitHub** após as absorções (código em `kaide-rs/core` e
`tools/company-autopilot/`, respectivamente). Não há mais `subtree pull`
possível — o Kaide é a única fonte. Histórico do `cli` não foi importado
(cópia, não subtree); do `company-autopilot`, integral via subtree.

- `tools/company-autopilot` lê/escreve Supabase prod e GitHub/GitLab com
  credenciais da máquina — nunca commitar `.env`/tokens (já fora do Git).
- Sinergia óbvia com o Kaide: jobs `commercial.daily/followup` e Control Plane
  podem delegar rotinas a esses agentes via ACP (`acp.py`) — integração futura.

## Adendo (2026-10-21) — reabsorção com histórico integral

O repo `chronokairo/company-autopilot` foi **recriado** na org depois da
deleção de 2026-10-08 e voltou a ter atividade própria (branch `main` com o
portfólio SaaS, mais 3 branches de feature). A cópia no Kaide, vinda do
`git subtree add` com squash, ficou desatualizada: trazia os agentes arquivados
em `.copilot/agent-archive/full-team/` e não tinha o histórico do repo-fonte.

Reabsorção feita com o mesmo método do monorepo `erp`:

1. `git filter-repo --to-subdirectory-filter tools/company-autopilot` no repo
   original (35 commits em `main` + 3 branches de feature) e
   `git merge --allow-unrelated-histories` no Kaide. Os 35 commits do `main`
   entram como segundo pai do merge — histórico integral, autoria e datas
   preservados.
2. Árvore final de `tools/company-autopilot` = a do repo-fonte em `main`
   (91 arquivos): agentes ativos em `.copilot/agents/`, portfólio SaaS e as
   correções de reliability. O `git` reconheceu as movidas de
   `agent-archive/full-team/` para `agents/` como renomes.
3. **Preservado o que era local do Kaide**: o bloco de diretriz
   `chronokairo-ui-hexagonal-migration` no `AGENTS.md` (commit local `7b9867c`,
   que nao existe em nenhuma branch do repo-fonte) e a remoção do
   `acp-adapters/package-lock.json` (paths locais `file:../../../Documents/...`,
   conforme o ponto 2 da decisão original).
4. As 3 branches de feature do repo-fonte foram preservadas no Kaide em
   `legacy/company-autopilot/*`:
   - `ck/minimal-team-madrugada` (3 commits: equipe mínima da madrugada,
     ADRs 0001–0004)
   - `feat/saas-agroflow-workmed-20261005` (10 commits)
   - `lu4nn3ry-adr-0005-night-team-expansion` (4 commits, era a PR #1 aberta)

O bloco "Configuração ativa — ADR 0001" **não** foi restaurado na árvore: ele
apontava para `.copilot/minimal-team/`, que existe apenas na branch
`ck/minimal-team-madrugada` (preservada), e contradiria a postura de `main`
(equipe completa ativa). Fica no histórico do Kaide.

Repos `chronokairo/company-autopilot` e `chronokairo/forgepair` deletados
após a absorção; o Kaide é a única fonte.
