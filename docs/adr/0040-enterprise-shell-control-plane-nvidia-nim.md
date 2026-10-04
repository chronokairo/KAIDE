# ADR-0040 - Shell Enterprise do Control Plane e Chat NVIDIA NIM

**Status:** Aceito  
**Data:** 2026-10-03  

## Contexto

A interface da empresa virtual precisava consolidar o acompanhamento do Control Plane, sessões por agente, terminal e chat operacional. O chat também precisava consultar modelos NVIDIA NIM dinamicamente, sem expor credenciais no cliente.

## Decisões

- A página inicial usa a cena `AtelierScene` como adapter visual do Control Plane.
- A navegação organiza estações e sessões por agente em uma única árvore; automações ficam em uma ação separada.
- O AppBar controla sidebar principal, painel inferior do terminal e sidebar secundário do chat.
- O terminal é um painel inferior persistente, inspirado no layout de IDEs, e não ocupa o sidebar do chat.
- O chat ocupa o sidebar secundário, com composer fixado no rodapé, histórico com scroll independente, anexos, voice-to-text, níveis de permissão, Markdown/GFM e seleção de modelo.
- Modelos são obtidos exclusivamente do endpoint NVIDIA NIM configurado no backend via `NVIDIA_NIM_API_KEY`/`NVIDIA_API_KEY`; o catálogo é cacheado por 24 horas e não há fallback de modelos.
- A rota de chat usa a credencial NVIDIA server-side do `.env` quando não há sessão Supabase; sessões autenticadas continuam preferenciais.
- O Control Plane usa Supabase como persistência obrigatória, sem fallback de store local em produção.

## Verificação

- Testes do adapter NVIDIA cobrem envio do modelo selecionado e erros upstream.
- Testes da rota de chat cobrem uso da credencial server-side sem Bearer e tradução de falha da NVIDIA.
- `npm run typecheck` passa.

## Consequências

- A chave NVIDIA nunca é enviada ao navegador.
- O catálogo pode ficar indisponível quando o `.env` não contém uma chave válida; nesse caso o seletor informa que não há modelos disponíveis.
- O shell visual permanece separado dos casos de uso e adapters de infraestrutura.
