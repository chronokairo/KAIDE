# ADR-0003 — Clique sem seletor: texto e role

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

A IA muitas vezes sabe o *texto* ou o *papel* de um elemento (ex.: botão "Salvar",
link "Planos") mas não um seletor CSS estável (classes minificadas, ids dinâmicos).
Gerar seletores frágeis aumenta a taxa de erro.

## Decisão

Duas tools de clique por semântica, inspiradas no Playwright (`getByText`/`getByRole`):

- `dom_click_text { text, exact? }` — varre elementos clicáveis (`button`, `a`,
  `[onclick]`, `[role]`, inputs checkbox/radio) e corresponde pelo texto visível
  (`innerText`/`value`), com match parcial ou exato; faz `scrollIntoView` e `click`.
- `dom_click_role { role, name?, index? }` — resolve elementos por ARIA `role` +
  nome acessível (`aria-label`, `aria-labelledby`, texto) e índice entre os candidatos.

Ambas rodam no MAIN world e devolvem erro claro quando nada corresponde.

## Consequências

- Positivas: seletores deixam de ser gargalo; funciona com shadow DOM via árvore de
  acessibilidade; APIs estáveis para a IA.
- Negativas: o match por texto pode acertar o elemento errado quando há textos
  duplicados (mitigado com `index`/`exact`); custo de varrer a página em páginas muito
  grandes (aceitável: single pass com `querySelectorAll`).
