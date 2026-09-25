# Análise do System Prompt do CLI

Este guia descreve como extrair e auditar o **system prompt efetivo** do CLI (já renderizado em runtime, com seções dinâmicas).

## Arquivos relacionados

- `docs/system-prompt-completo.txt` — dump completo já extraído no estado atual do projeto.
- `source/src/constants/prompts.ts` — origem da composição do prompt (`getSystemPrompt`).
- `source/src/utils/systemPrompt.ts` — lógica do prompt efetivo (override/agent/coordinator/custom).
- `source/src/entrypoints/cli.tsx` — flag de dump (`--dump-system-prompt`).

## Como extrair o prompt completo

1. Garanta que o build inclua a feature `DUMP_SYSTEM_PROMPT` em `build.ts`.
2. Gere o bundle:

```sh
AUTHORIZED=1 ~/.bun/bin/bun run build.ts
```

3. Extraia o prompt:

```sh
node dist/cli.js --dump-system-prompt --model code-sonnet-4-6 > /tmp/full-system-prompt.txt
```

## O que validar na análise

- **Identidade e instruções-base** (`# System`, `# Doing tasks`, `# Using your tools`, etc.).
- **Seções dinâmicas** (ambiente, memória, MCP, output style, language, agent/coordinator).
- **Fonte da variação**: flags de build (`feature(...)`) + variáveis de ambiente + modo da sessão.

## Troubleshooting rápido

- Erro com símbolos do SDK (ex.: `Chronokairo is not defined`): revisar stub em `source/src/stubs/chronokairo-sdk.ts`.
- Flag não reconhecida (`--dump-system-prompt`): confirmar `DUMP_SYSTEM_PROMPT` nas features do `build.ts` e rebuild.

