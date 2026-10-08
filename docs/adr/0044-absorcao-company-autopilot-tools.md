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
4. **Repo-fonte preservado** (`chronokairo/company-autopilot` continua existindo;
   evoluções futuras entram via `git subtree pull`). Python validado com
   `py_compile`; sem acoplamento com o web (tools standalone, como as demais).

## Consequências / débitos

- `tools/company-autopilot` lê/escreve Supabase prod e GitHub/GitLab com
  credenciais da máquina — nunca commitar `.env`/tokens (já fora do Git).
- Sinergia óbvia com o Kaide: jobs `commercial.daily/followup` e Control Plane
  podem delegar rotinas a esses agentes via ACP (`acp.py`) — integração futura.
