# ADR-0006: Rapunzel — chat de criação de conteúdo (subpath `./rapunzel`)

- **Data:** 2026-09-24
- **Status:** Aceito

## Contexto

O produto `chronokairo/content` (Content Production System) precisa de um agente
de IA voltado à criação de conteúdo (briefings, formatos, variações, bulk CSV,
regras de Design System Engine). O agente existente (`Froia`) é especializado em
design/UX e permanece sendo consumido pelo app de design. Para não duplicar o
componente de chat, extraímos o painel genérico.

## Decisão

1. **`ChatPanel`** (`src/modules/ai/components/ChatPanel.tsx`): painel de chat
   reutilizável parametrizado por `persona` (nome, papel, saudação, comandos
   slash, prompts rápidos, rota da API e rodapé).
2. **`FroiaChat`** vira wrapper fino do `ChatPanel` com a persona de design/UX
   (mantém o subpath `@chronokairo/ai/froia` e a rota `/api/froia`).
3. **`RapunzelChat`** (novo): wrapper fino com persona de conteúdo (subpath
   `@chronokairo/ai/rapunzel`, rota `/api/rapunzel`, proxy Anthropic com system
   prompt de produção de conteúdo).
4. Nenhum consumidor do Froia é quebrado; o app de design continua no subpath
   `./froia`.

## Consequências

- Fontes únicas: um único painel de chat para todos os agentes da plataforma.
- O `chronokairo/content` importa `@chronokairo/ai/rapunzel`.
- Futuras personas (ex.: analytics) adicionam apenas um wrapper + system prompt.