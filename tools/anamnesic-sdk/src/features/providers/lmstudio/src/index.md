# providers/lmstudio/src/

Implementação interna do provider LM Studio. Esta pasta contém os módulos responsáveis por descoberta de modelos, autenticação, streaming, embeddings e configuração interativa/não-interativa.

## Propósito

O diretório `src/` encapsula todos os detalhes de implementação do provider LM Studio, separados da interface pública exposta por `../index.ts` e `../api.ts`. Os módulos aqui comunicam-se com o servidor LM Studio, normalizam dados de modelos, gerenciam autenticação e suportam recursos como preload de modelo e tool calls em texto plano.

## Arquivos de implementação

| Arquivo | Papel |
|---|---|
| [`api.ts`](./api.ts) | **Fachada pública interna.** Re-exporta todos os símbolos públicos de `defaults.ts`, `models.ts`, `runtime.ts` e `setup.ts`. É o ponto de re-exportação usado por `../api.ts`. |
| [`defaults.ts`](./defaults.ts) | **Constantes e valores padrão.** Define URLs base (`http://localhost:1234`, Docker host), URL de inferência (`/v1`), modelo de embedding padrão (`text-embedding-nomic-embed-text-v1.5`), variável de ambiente (`LM_API_TOKEN`), placeholder de API key local (`lmstudio-local`), contexto padrão de carga (64 000 tokens) e modelo padrão (`qwen/qwen3.5-9b`). |
| [`models.ts`](./models.ts) | **Mapeamento e normalização de modelos.** Define o tipo `LmstudioModelWire` (formato da API LM Studio), funções de normalização de catálogo configurado (`normalizeLmstudioConfiguredCatalogEntries`), resolução de capability de raciocínio (`resolveLmstudioReasoningCapability`), resolução de URL de inferência e base do servidor, e mapeamento de modelos da API para o formato interno (`mapLmstudioWireEntry`, `mapLmstudioWireModelsToConfig`). |
| [`models.fetch.ts`](./models.fetch.ts) | **Busca e carga de modelos via HTTP.** Implementa `fetchLmstudioModels` (consulta `/api/v0/models`), `discoverLmstudioModels` (descoberta completa), e `ensureLmstudioModelLoaded` (solicita ao LM Studio que carregue um modelo específico antes da inferência). Gerencia timeouts e erros de rede. |
| [`runtime.ts`](./runtime.ts) | **Resolução de contexto de runtime.** Funções para construir headers de autenticação (`buildLmstudioAuthHeaders`), resolver a API key em runtime (`resolveLmstudioRuntimeApiKey`, `resolveLmstudioConfiguredApiKey`), headers do provider (`resolveLmstudioProviderHeaders`) e contexto de requisição (`resolveLmstudioRequestContext`). |
| [`setup.ts`](./setup.ts) | **Configuração do provider.** Implementa os fluxos interativo (`promptAndConfigureLmstudioInteractive`) e não-interativo (`configureLmstudioNonInteractive`) de setup. Gerencia descoberta (`discoverLmstudioProvider`), preparação de modelos dinâmicos (`prepareLmstudioDynamicModels`), e aplicação de configuração de modelo padrão. |
| [`stream.ts`](./stream.ts) | **Streaming de inferência com preload.** Implementa `wrapLmstudioInferencePreload` — wrapper que garante que o modelo esteja carregado no LM Studio antes de iniciar o streaming. Aplica backoff exponencial em falhas de preload (5 s a 5 min). Suporta tool calls via JSON nativo e via texto plano (`parseLmstudioPlainTextToolCalls`). |
| [`embedding-provider.ts`](./embedding-provider.ts) | **Provider de embeddings.** Implementa `createLmstudioEmbeddingProvider` para gerar vetores via endpoint `/v1/embeddings` do LM Studio. Garante que o modelo de embedding esteja carregado antes das requisições. Suporta prefixo `lmstudio/` no ID do modelo. |
| [`plain-text-tool-calls.ts`](./plain-text-tool-calls.ts) | **Parser de tool calls em texto plano.** Função `parseLmstudioPlainTextToolCalls` que extrai chamadas de ferramenta de texto puro (fallback para modelos sem suporte nativo a tool calling). Gera IDs sintéticos de tool call via UUID. |
| [`provider-auth.ts`](./provider-auth.ts) | **Lógica de autenticação do provider.** Funções para detectar header `Authorization` configurado (`hasLmstudioAuthorizationHeader`), resolver modo de autenticação (`resolveLmstudioProviderAuthMode`), e determinar se deve usar autenticação sintética (`shouldUseLmstudioSyntheticAuth`) — ativa quando modelos estão declarados mas nenhuma chave real está configurada. |

## Arquivos de teste

| Arquivo | O que testa |
|---|---|
| [`models.test.ts`](./models.test.ts) | Mapeamento de modelos da API, normalização de catálogo, resolução de raciocínio e contexto. |
| [`runtime.test.ts`](./runtime.test.ts) | Construção de headers de autenticação, resolução de API key e contexto de requisição. |
| [`setup.test.ts`](./setup.test.ts) | Fluxos de configuração interativo e não-interativo, descoberta de provider, modelos dinâmicos. |
| [`stream.test.ts`](./stream.test.ts) | Preload de modelo, backoff exponencial em falhas, streaming com e sem tool calls. |

## Contexto de uso

Os módulos desta pasta são importados exclusivamente por `../index.ts` (diretamente ou via `../api.ts`). O consumidor externo não deve importar de `src/` diretamente.

A separação entre `models.ts` (normalização) e `models.fetch.ts` (I/O de rede) permite testar a lógica de mapeamento de modelos sem dependências de rede.
