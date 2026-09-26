# ADR-0011 — Allowlist de domínios

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Um servidor MCP global pode navegar/ler qualquer URL. Para reduzir o risco de o agente
sair do escopo (ex.: acessar painel administrativo por engano), é útil restringir a
navegação.

## Decisão

Config em `~/.browser-mcp-allowlist.json`:

```json
{ "mode": "allowlist", "domains": ["example.com", "*.gov.br"] }
```

- `mode: "allow"` (padrão) — libera tudo (compatibilidade).
- `mode: "allowlist"` — só URLs cujo hostname case com os `domains` (suporta `*.`).
- `mode: "deny"` — bloqueia tudo.

O `guardUrl` é aplicado no servidor nas tools que recebem URL: `open_tab`,
`navigate_tab`, `create_window`, `dom_fetch` e `dom_download`. `allowlist_status` expõe
a config vigente. O arquivo é relido a cada chamada (edição vale na hora, sem restart).

## Consequências

- Positivas: controle simples e imediato; default seguro-compatível (`allow`); central
  no servidor (fonte única da verdade).
- Negativas: **não é por projeto** (o servidor é global e não sabe qual projeto chamou);
  `read_page`/`dom_click_*`/`inject_script` atuam na aba atual e não passam pelo guard
  (a aba já existe); o modo padrão depende do usuário configurar.
