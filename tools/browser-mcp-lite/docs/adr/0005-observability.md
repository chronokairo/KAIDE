# ADR-0005 — Observabilidade: page_log, network_har e watch_page

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Para depurar com o navegador real, a IA precisa saber o que aconteceu: mensagens de
console, erros JS, requisições e quando a página mudou.

## Decisão

Três tools de observabilidade que instalam captura no **MAIN world** da página (para ver
o console/erros/fetch do próprio site):

- `page_log { clear?, limit? }` — wrapper de `fetch` + hooks de `console.error`/`error`/
  `unhandledrejection`, buffer de até 500 entradas por aba.
- `network_har { clear?, max? }` — captura `fetch` e `XMLHttpRequest` com método, URL,
  status, `content-type`, headers de resposta, corpos (limitados a 10k chars, só
  text/json) e tempo (`durationMs`). Instala por aba na primeira chamada.
- `watch_page { timeout? }` — instala um `MutationObserver` (`window.__mutationCount`) e
  espera a primeira mudança de DOM ou de URL, retornando `{ changed, mutations }`.

## Consequências

- Positivas: diagnóstico completo de sessões logadas (status de API, payloads, erros);
  `watch_page` substitui polling cego.
- Negativas: captura só começa após a primeira chamada (não existe histórico anterior);
  **navegação/resumo da página zera o buffer** (o MAIN world reinicia); corpos são
  truncados por segurança; overhead pequeno no `fetch` da página.
