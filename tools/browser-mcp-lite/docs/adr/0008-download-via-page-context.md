# ADR-0008 — Download via contexto da página

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

Baixar arquivos protegidos por sessão (Cloudflare/auth) falha com `fetch` do servidor
Node. O download precisa acontecer dentro da página logada.

## Decisão

`dom_download { url, filename? }`: um script injetado no MAIN world faz
`fetch(url, { credentials: 'include' })` **no contexto da página** (usa cookies/sessão,
passa por challenges), retorna o conteúdo em base64 para o servidor, que grava em
`server/downloads/` (nome deduplicado: `1_nome`, `2_nome`...). Pasta ignorada no git.

## Alternativas avaliadas

- `chrome.downloads.download`: baixaria direto do Chrome (real, com barra de download),
  mas exige a permissão `"downloads"` no manifest — amplia o escopo. Mantido como item
  futuro no TODO.

## Consequências

- Positivas: baixa arquivos logados sem novas permissões; resultado determinístico
  (arquivo em disco + bytes/content-type).
- Negativas: precisa que a página aceite CORS para a URL (origem pode bloquear);
  conteúdo em memória antes de gravar (arquivos grandes pesam no worker); não reproduz
  downloads via `Content-Disposition` nativa do Chrome.
