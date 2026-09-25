# ADR 0016 — Absorção do AegisOS / Anamnesic Sandbox (Execução Segura em Containers)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `sandbox`, `aegisos`, `docker`, `policy-engine`, `agent-runtime`, `seguranca`, `consolidacao`

---

## Contexto

A execução de comandos arbitrários por agentes autônomos de IA apresenta riscos críticos à máquina do usuário. O projeto `aegisos` (`anamnesic/anamnesic-sandbox`) desenvolveu uma camada de orquestração onde o LLM opera contra contêineres Docker isolados (perfis Debian Seguro, Ubuntu Dev/AI e NixOS Declarativo) sob uma política estrita de segurança e validação de comandos.

## Decisão

1. Absorver o AegisOS em `chronokairo-ai/tools/sandbox`.
2. Habilitar a política de containers e isolamento para servir de backend de execução segura para o coding agent `ckc`.
3. Deletar o repositório remoto redundante `anamnesic/anamnesic-sandbox`.
