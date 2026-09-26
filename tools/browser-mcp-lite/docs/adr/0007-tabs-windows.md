# ADR-0007 — Abas e janelas múltiplas (incl. incognito)

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Fluxos reais usam várias abas (comparar páginas) e janelas separadas (um navegador
"limpo" por contexto). O Chrome expõe isso via `chrome.tabs`/`chrome.windows`.

## Decisão

- **Abas:** `close_tab` e `duplicate_tab` (duplica aba com histórico preservado).
- **Janelas:** `list_windows` (`getAll({populate:true})` → janelas + abas),
  `create_window { url?, incognito?, focused? }`, `close_window { windowId }` e
  `merge_windows { fromWindowId, toWindowId }` (move abas com `chrome.tabs.move` e fecha
  a janela de origem).
- Incognito é suportado via `create_window { incognito: true }`; se a extensão não
  estiver habilitada no modo anônimo, retorna erro explicativo.

Permissões: `tabs` (já existia) cobre URLs/títulos das abas populadas; nada de novo no
manifest.

## Consequências

- Positivas: cenários multi-contexto e limpeza de janela funcionais; incognito para
  sessões isoladas.
- Negativas: extensão precisa estar habilitada em incognito manualmente pelo usuário
  (impossível via API); `merge_windows` com janelas em telas diferentes pode reorganizar
  abas (ordem preservada com `index: -1`).
