# ADR-0014 — Auto-start do servidor e sincronização de token

- **Data:** 2026-08-16
- **Status:** Aceito

## Contexto

O servidor MCP é um processo separado do opencode. Tê-lo iniciado e com token válido a
todo momento é pré-requisito para o `browser` funcionar em qualquer projeto.

## Decisão

- **Auto-start via plugin global** (`~/.config/opencode/plugin/browser-mcp-lite.js`):
  ao abrir o opencode, faz `GET /ping`; se o servidor não responder, spawna
  `node index.js` (cwd `server/`, detached, unref) e aguarda prontidão.
- **Token sincronizado** (`server/token.js`): o token fica em
  `~/.browser-mcp-secrets.json` (permissões restritas) e um espelho em texto puro
  `~/.browser-mcp-secrets.token` **sem newline final**, referenciado pelo opencode via
  `{file:~/.browser-mcp-secrets.token}` no header `Authorization`. Um único arquivo de
  secrets evita dessincronização entre servidor e config.

## Consequências

- Positivas: zero setup por projeto; token sempre em sincronia; arquivo de secrets
  ignorado pelo git (`.gitignore`).
- Negativas: processo órfão (não morre com o opencode — precisa do restart do servidor
  manualmente para aplicar código novo); espelho em texto puro é um arquivo sensível
  (aceito para uso local em máquina pessoal).
