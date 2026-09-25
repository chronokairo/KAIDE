# ADR 0014 — Absorção do Clamp (Scaffolding de Tool Calling e Confiabilidade para SLMs)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `clamp`, `slm`, `tool-calling`, `json-repair`, `zod`, `harness`, `consolidacao`

---

## Contexto

Modelos locais pequenos (SLMs como Qwen 2.5, Llama 3 8B, Nemotron, Gemma) frequentemente falham em chamadas de ferramentas:
1. Produzem JSON malformado (aspas não escapadas, chaves ausentes).
2. Não respeitam esquemas rígidos de parâmetros.
3. Emitem chamadas de ferramentas em blocos de texto puro em vez de JSON estruturado.

O projeto `clamp` (adquirido da organização `anamnesic`) desenvolveu uma camada de confiabilidade baseada em proveniência Kairos para forçar modelos locais a respeitarem contratos via Zod, reparo dinâmico de JSON balanceado e parsers de tool calling resilientes.

## Decisão

1. Absorver o `clamp` em `chronokairo-ai/tools/clamp`.
2. Utilizar suas bibliotecas centrais (`balanced-json.ts`, `plain-text-tool-calls.ts`, `tool-call-args.ts`, `apply-patch.ts`) como utilitários compartilhados para o coding agent nativo `ckc` e o harness de IA.
3. Deletar o repositório remoto redundante `anamnesic/clamp`.
