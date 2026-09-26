# ADR-0002 — Auto-wait e interações DOM determinísticas

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

SPAs (React/Angular) renderizam de forma assíncrona. Ações imediatas falham com
"elemento não encontrado". O estilo Playwright resolve com *auto-wait*, mas sem
adicionar dependência pesada nem CDP.

## Decisão

Adicionar `wait_for` e um conjunto de ações DOM que rodam no contexto da página
(`chrome.scripting.executeScript`, MAIN world), com retries internos:

- `wait_for` — aguarda seletor (`querySelector`), texto (`innerText`/`value`) ou rede
  ociosa (`performance.getEntriesByType('resource')` estável por N ms), com timeout
  configurável; opcionalmente executa uma ação ao encontrar.
- `dom_scroll`, `dom_hover`, `dom_type`, `dom_press_key`, `dom_check`, `dom_select` —
  disparam eventos nativos do DOM (`MouseEvent`, `KeyboardEvent`, `Event`) sobre os
  elementos, respeitando foco, checked e <select>.

Toda função injetada é **autossuficiente** (helpers como `KEY_CODE_MAP` e seletores são
inline): `executeScript` serializa a função, e referências externas quebram.

## Consequências

- Positivas: esperas determinísticas sem polling do servidor; interações funcionam em
  SPAs reais; zero dependências novas.
- Negativas: eventos são **sintéticos** (`dispatchEvent`) e alguns sites checam
  `event.isTrusted` (ver ADR-0004); não há *pointer* real (sem CDP).
