# ADR-0002: Centralização da IA do ecossistema no `chronokairo/ai`

- **Data:** 2026-09-23
- **Status:** Aceito

## Contexto

O produto **froia** (app Next.js de design/UX) tinha capacidades de IA embutidas:
o widget `FroiaChat` e a rota `app/api/froia/route.ts` (proxy streaming para a API
Anthropic). Isso duplicava responsabilidade de IA — que deve ser centralizada no
`chronokairo/ai` (RAG, MCP e integrações de IA do ecossistema).

Além disso, adaptadores de provedores de LLM (17, derivados do Kairos Code/Claude
Code) chegaram a ser migrados para cá, mas dependiam fortemente de `kairos/plugin-sdk`
(runtime interno do CLI, não publicado) e foram removidos para readição posterior.

## Decisão

1. **`ai` é a fonte única de IA**: `FroiaChat` foi movido do froia para
   `src/modules/ai/components/FroiaChat.tsx`; a rota de proxy para
   `src/app/api/froia/route.ts`.
2. **Exposição para consumidores**: `package.json` expõe o subpath
   `chronokairo-desktop/froia` (→ `FroiaChat`). O froia importa via dependência
   git+npm (`github:chronokairo/ai#main`), sem duplicar código de IA.
3. **LLM providers removidos**: os 17 providers (`llm-providers/*`) foram deletados
   por dependerem de `kairos/plugin-sdk` (não resolvível). Serão readicionados
   desacoplando do plugin-sdk (piloto validado com `groq`: shim local `_sdk/` +
   reimplementação dos helpers de runtime do zero, sem código Anthropic).

## Consequências

- Toda capacidade de IA (chat, providers, RAG) passa a viver no `ai`.
- O froia consome o chat como pacote, sem manter proxy Anthropic próprio.
- Débito aberto: readicionar os LLM providers desacoplados (ver inventário de
  features em backlog). Providers pesados (google, github-copilot, ollama,
  deepinfra) exigem reimplementar runtime de image/video/speech/oauth/embeddings.
- Licença: código derivado do Claude Code (Anthropic) deve ser reescrito do zero
  ao readicionar, reduzindo exposição.
