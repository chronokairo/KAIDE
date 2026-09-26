# ADR-0001 — Extensão Chrome + servidor MCP remoto (bridge WebSocket)

- **Data:** 2026-08-16
- **Status:** Aceito
- **Decisão relacionada:** N/A (fundação do projeto)

## Contexto

O LMS da ChronoKairo usa um navegador real com sessões logadas (Cloudflare, autenticação)
e o opencode precisa controlar esse navegador. Um servidor MCP puro (Node) não tem acesso
ao DOM nem às sessões; extensões MV3 não podem abrir portas de rede nem servir HTTP.

## Decisão

Arquitetura em duas partes conectadas por WebSocket:

1. **Extensão Chrome** (`extension/background.js`): serviço worker MV3 com as permissões
   mínimas (`tabs`, `activeTab`, `scripting`, `alarms`, `storage`, `cookies`) que detém o
   acesso real ao navegador e injeta scripts (ISOLATED/MAIN world).
2. **Servidor MCP** (`server/`): Fastify + `@modelcontextprotocol/sdk`, serve MCP via
   Streamable HTTP em `http://127.0.0.1:12307/mcp` e fala com a extensão por WebSocket
   (`/ws`), autenticado por token Bearer.

O bridge (`server/bridge.js`) serializa chamadas `{id, method, params}` → promessas
resolvidas pela resposta da extensão, com timeout de 30s. Isso permite `sendToExtension`
ser testável sem subir o servidor.

## Consequências

- Positivas: sessões do navegador real; permissões ficam na extensão (menor superfície no
  servidor); servidor testável isoladamente (6 testes).
- Negativas: exige Chrome aberto com a extensão conectada; chamadas só funcionam com a
  extensão conectada (erro claro caso contrário); estado entre extensão e servidor é
  acoplado por um socket único (uma extensão por servidor).
