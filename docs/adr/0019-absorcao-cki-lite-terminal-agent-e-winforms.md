# ADR 0019 — Absorção do CKI-Lite (Terminal Agent NVIDIA NIM Python & Client WinForms)

- **Status:** Aceito
- **Data:** 2026-09-25
- **Decisores:** Time ChronoKairo
- **Tags:** `cki-lite`, `nvidia-nim`, `terminal-agent`, `guardrails`, `winforms`, `consolidacao`

---

## Contexto

Dois repositórios satélites orbitavam o ecossistema com ferramentas para NVIDIA NIM:
1. `chronokairo/ckc`: Continha o `cki-lite.py` (um coding agent de terminal em Python puro com zero dependências externas, compatível com Alpine Linux, streaming SSE e guardrails em 3 níveis: read automático, mutate com confirmação interativa e destroy com confirmação forte). Seu nome causava colisão com o crate oficial `ckc` em Rust que opera no core do Tauri desktop.
2. `chronokairo/cki-lite-desktop`: Interface gráfica nativa para Windows em C# WinForms compilável diretamente com `csc.exe` (.NET Framework 4.x) para automação via PowerShell.

## Decisão

1. Absorver o agente de terminal `cki-lite.py`, seus 8 ADRs arquiteturais de segurança e o cliente nativo Windows em `chronokairo-ai/tools/cki-lite/`.
2. Preservar o crate oficial `ckc` em Rust (`src-tauri/core`) como o coding agent padrão da ChronoKairo.
3. Deletar os repositórios remotos redundantes `chronokairo/ckc` e `chronokairo/cki-lite-desktop`.
