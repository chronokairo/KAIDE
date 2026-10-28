# ADR 0013 — Absorção dos Módulos de IA do Research (RAG/MCP e NVIDIA LLM Ranking)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time Chronokairo
- **Tags:** `research`, `ai`, `rag`, `mcp`, `benchmarks`, `nvidia-nim`, `consolidacao`

---

## Contexto

No repositório `chronokairo/research` (laboratório de P&D da Chronokairo), foram desenvolvidos dois módulos focados em inteligência artificial:
1. `apps/research`: Um sistema RAG avançado com interface MCP, busca semântica, integração acadêmica e streaming SSE via Ollama local.
2. `apps/nvidia-llm-ranking`: Uma aplicação Next.js para avaliação, benchmarking e ranking comparativo de modelos LLM (NVIDIA NIM e OpenRouter).

Conforme estabelecido no [AGENTS.md](file:///home/luann/.chronokairo/repos/AGENTS.md), o `chronokairo-ai` é a **fonte única de IA** (RAG, MCP, chat, providers de LLM, ferramentas de inteligência).

## Decisão

1. **Absorver** os módulos de IA no `chronokairo-ai` dentro do diretório `tools/`:
   - `tools/research-rag`: RAG com MCP e streaming local/TOTVS.
   - `tools/nvidia-llm-ranking`: Aplicação de benchmarking e ranking comparativo de LLMs.
2. Manter o repositório `chronokairo/research` ativo exclusivamente como hub de protótipos de P&D não-IA (ex.: `sacidata` - monitoramento IoT de igarapés, `clinical` - prontuários médicos, `prototype-didactic-acai`, `news`, etc.).

---

## Consequências

- **Positivas:**
  - Todo o ferramental de avaliação de modelos e prototipagem de RAG fica unificado no ecossistema oficial do `chronokairo-ai`.
  - Zero duplicação de esforço de IA no repositório de pesquisa.
- **Débitos Técnicos Registrados:**
  - Integrar os endpoints de benchmarking do NVIDIA LLM Ranking à suite de avaliação contínua do coding agent `ckc`.
  - Conectar os conectores de busca semântica do `research-rag` à esteira principal de RAG corporativo do `ai`.
