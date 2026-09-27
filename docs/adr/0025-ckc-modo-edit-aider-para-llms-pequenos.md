# ADR-0025 — Modo edit (aider-like) no `ckc` CLI para LLMs pequenos: editar/autocompletar apenas o arquivo aberto, em vez de agent

**Status:** Aceito (débito aberto)
**Data:** 2026-09-26

## Contexto

O `ckc` é um coding agent de loop completo (planner → coder → tools →
verificação → subagentes), desenhado para modelos com tool calling confiável.
Modelos locais pequenos (qwen3:1.7b, granite3.3:2b, 0.6b) degradam nesse loop:
múltiplas chamadas, contexto amplo (RepoMap + AGENTS.md + transcript) e tool
calls estruturadas excedem o que 2B consegue sustentar com qualidade.

O Aider provou o padrão oposto para SLMs: um modo **edit-only** — alvo fixo
(arquivo aberto), diff/patch dirigido, sem loop de agente — que torna modelos
pequenos úteis. O `ckc` já tem as peças de base: editor com binding do arquivo
ativo na TUI (ADR-0023), tools de edição transacional (`fs`, `find_replace`,
`patch`), confiabilidade de tool calling para SLMs absorvida do Clamp
(ADR-0014) e bridges de IDE (ADR-0015) que poderiam consumir o mesmo backend.

## Decisão

Adicionar ao `ckc` CLI um **modo edit** (`ckc --mode edit` ou `/mode edit` na
TUI), inspirado no Aider, como débito de desenvolvimento:

1. **Sem loop de agent**: nada de planner, tool registry, subagentes ou
   execução de comandos — o modelo nunca "decide ferramentas"; o runtime
   dirige a edição.
2. **Alvo fixo**: o arquivo aberto no editor (active file binding do
   ADR-0023). Ler/goto do arquivo, editar via `find_replace`/`patch` curto e
   autocomplete inline do trecho sob o cursor — nunca o workspace inteiro.
3. **Formato por capacidade do modelo** (refina o item A13 do roadmap de
   mercado): SLMs 2B emitem diff/find-replace minimalista com verificação de
   aplicação e fallback literal, sem exigir tool calling nativo; modelos
   maiores continuam no fluxo de agent.
4. **Escopo mínimo de permissões**: modo restrito ao arquivo aberto
   (read-only no resto do workspace); aprovação implícita limitada a esse
   arquivo — sem approval de execução.
5. **Orçamento de contexto por arquivo**: tail + goto do arquivo ativo,
   sem RepoMap completo quando o modelo é pequeno; compactação barata
   (compressor layer1 já existente) entre turnos.
6. **Backend para as bridges de IDE** (ADR-0015): o modo edit serve de
   autocomplete/edit para VS Code/Antigravity via API Ollama-compat.

## Consequências

- SLMs 2B tornam-se utilizáveis para edit/autocomplete (paridade com Aider),
  com consumo de contexto e latência muito menores que o agent mode.
- O modo edit **não substitui** o agent mode: é uma porta de entrada leve
  para o `ckc` no dia a dia do editor.
- Débitos derivados: indicador de modo na TUI, streaming incremental do
  autocomplete, rate/latência para uso interativo, e suíte de testes de
  aplicação de patch por SLM (estendendo `tests/p0_*`).
- Referências de mercado: Aider (formato de edição por modelo), Zed
  `edit-agent`/inline assist, Copilot CLI Ctrl+Space (voice/inline), Crush
  `ask_user` — janela set/2026 dos changelogs em `docs/market/changelogs/`.
