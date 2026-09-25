# @chronokairo/sdk

Cliente de provider embarcado, runtime de sandbox e utilitários compartilhados do kairos-code.

## Objetivo

Este pacote é a **camada de infraestrutura** da arquitetura. Fornece:

- Cliente de API compatível com Anthropic/OpenAI para todos os providers suportados
- Catálogo dinâmico de modelos via [models.dev](https://models.dev)
- Runtime de sandbox com políticas de restrição de filesystem e rede
- Utilitários de retry, hooks, triggers e multimodal
- Camada de tradução OpenAI ↔ Chronokairo
- Autenticação GitHub Copilot (OAuth device flow)

O SDK é consumido por todas as três superfícies: VS Code extension, Electron app e CLI.

## Módulos principais

| Módulo | Responsabilidade |
|--------|-----------------|
| `client.ts` | `ChronokairosClient` — cliente principal de API |
| `openaiCompat.ts` | `OpenAICompatClient` + funções de tradução de mensagens/tools |
| `modelCatalog.ts` | `fetchModelCatalog`, `lookupModel`, `getContextWindow`, `getProviderEnvVars`, `modelHasReasoning` |
| `effort.ts` | `modelSupportsEffort`, `availableEffortLevels` (importa `EffortLevel` do `@chronokairo/core`) |
| `retry.ts` | `withRetry`, `calculateDelay`, `sleep` — política de retry genérica |
| `errors.ts` | Classes de erro da API: `RateLimitError`, `APIError`, `ModelNotFoundError`, etc. |
| `sandbox.ts` | `SandboxManager`, `SandboxViolationStore` — runtime de segurança |
| `credentials.ts` | Gestão de credenciais de provider |
| `copilotAuth.ts` | OAuth device flow para GitHub Copilot |
| `hooks.ts` | Sistema de hooks de ciclo de vida |
| `triggers.ts` | Triggers de eventos do agente |
| `tools.ts` | Definições de tools integradas |
| `multimodal.ts` | Helpers de imagem e conteúdo multimodal |
| `providers.ts` | Registro e detecção de providers ativos |
| `mcpb.ts` | Compatibilidade com manifests MCP |

## Relação com @chronokairo/core

O SDK **depende** do `@chronokairo/core` para primitivos puros:

```
@chronokairo/sdk
    └── @chronokairo/core   ← EffortLevel, errorClassifiers, constants
```

**Nunca** redefina tipos ou funções que já existem no core.

| Responsabilidade | Onde fica |
|-----------------|-----------|
| Classificar strings de erro (stderr, IPC) | `@chronokairo/core` |
| Lançar erros tipados da API | `@chronokairo/sdk/errors.ts` |
| Tipo `EffortLevel` | `@chronokairo/core` |
| Lógica de `modelSupportsEffort` | `@chronokairo/sdk/effort.ts` |
| Constantes de UI (cooldown, backoff) | `@chronokairo/core` |
| Política de retry (withRetry, SLA) | `@chronokairo/sdk/retry.ts` |

## Regras de contribuição

1. **Renderer-safe por módulo** — módulos importados pelo Vite renderer (principalmente `openaiCompat.ts`) não podem usar Node built-ins. Use `globalThis.crypto`, não `import { randomUUID } from 'crypto'`.
2. **Sem duplicação do core** — classifiers de string, `EffortLevel` e constantes de UI pertencem ao `@chronokairo/core`.
3. **Sem I/O no renderer** — `sandbox.ts`, `credentials.ts` e `copilotAuth.ts` são Node-only; não importe esses módulos em código de renderer.
4. **Re-exporte do core quando necessário** — `effort.ts` faz `export type { EffortLevel }` para que consumers do SDK não precisem importar dois pacotes.

## Quem usa

| Superfície | Módulos usados |
|-----------|---------------|
| `packages/vscode` | `client`, `openaiCompat`, `modelCatalog`, `effort`, `retry`, `providers` |
| `packages/app` (main) | `client`, `modelCatalog`, `sandbox`, `credentials`, `retry` |
| `packages/app` (renderer) | `openaiCompat` (tipos), `modelCatalog` (catálogo), `effort` |
| `packages/cli` | externalizado no bundle — linkado via `CLI_EXTERNAL_PACKAGES` |
