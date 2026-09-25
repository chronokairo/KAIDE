# providers/ollama/src/

Implementação interna do provider Ollama. Esta pasta contém todos os módulos especializados que compõem a lógica de descoberta, streaming, embeddings, configuração e utilidades do provider.

## Propósito

O diretório `src/` encapsula os detalhes de implementação do provider Ollama, separados da interface pública exposta por `../index.ts` e `../api.ts`. Os módulos aqui são responsáveis por toda a comunicação com o servidor Ollama, normalização de dados, autenticação e suporte a recursos avançados como busca na web e embeddings.

## Arquivos de implementação

| Arquivo | Papel |
|---|---|
| [`defaults.ts`](./defaults.ts) | **Constantes e valores padrão.** Define URLs base (`http://127.0.0.1:11434`, Docker host, cloud), janela de contexto padrão (128 000 tokens), custo zero, modelo padrão (`gemma4`) e modelo de embedding padrão (`nomic-embed-text`). |
| [`discovery-shared.ts`](./discovery-shared.ts) | **Lógica compartilhada de descoberta.** Contém `OLLAMA_PROVIDER_ID`, `OLLAMA_DEFAULT_API_KEY`, tipo `OllamaPluginConfig` e a função `resolveOllamaDiscoveryResult` — núcleo da lógica de descoberta automática do provider (verifica env vars, baseUrl, chaves configuradas). |
| [`provider-models.ts`](./provider-models.ts) | **Listagem e enriquecimento de modelos.** Funções para buscar (`fetchOllamaModels`), enriquecer com janela de contexto (`enrichOllamaModelsWithContext`), consultar metadados de modelo (`queryOllamaModelShowInfo`) e construir a definição de modelo (`buildOllamaModelDefinition`). Inclui política SSRF para URLs permitidas. |
| [`provider-base-url.ts`](./provider-base-url.ts) | **Leitura de URL base do provider.** Função utilitária `readProviderBaseUrl` que lê `baseUrl` ou `baseURL` de uma `ModelProviderConfig`, normalizando a propriedade independentemente de capitalização. |
| [`setup.ts`](./setup.ts) | **Configuração do provider.** Implementa os fluxos interativo (`promptAndConfigureOllama`) e não-interativo (`configureOllamaNonInteractive`) de setup. Gerencia a escolha entre modo local e cloud, pull automático de modelos (`ensureOllamaModelPulled`), e construção do provider configurado (`buildOllamaProvider`). |
| [`stream.ts`](./stream.ts) | **Streaming de inferência.** Implementa `createConfiguredOllamaStreamFn` e `createConfiguredOllamaCompatStreamWrapper`. Lida com o protocolo Ollama nativo, compatibilidade OpenAI, injeção de `num_ctx`, detecção de texto "garbled" em modelos como GLM/Kimi, thinking/raciocínio nativo, e parsing seguro de JSON com inteiros grandes. |
| [`model-id.ts`](./model-id.ts) | **Normalização de IDs de modelo.** Função `normalizeOllamaWireModelId` que remove prefixos como `ollama/` do ID do modelo antes de enviá-lo ao servidor Ollama. |
| [`ollama-json.ts`](./ollama-json.ts) | **Parser JSON seguro.** Implementação de `parseJsonPreservingUnsafeIntegers` — lida com inteiros muito grandes (além de `Number.MAX_SAFE_INTEGER`) que o Ollama pode retornar em respostas, convertendo-os para strings antes do parse. |
| [`embedding-provider.ts`](./embedding-provider.ts) | **Provider de embeddings.** Implementa `createOllamaEmbeddingProvider` para gerar vetores de embeddings via API Ollama (`/api/embed`). Suporta modo local e cloud, autenticação via API key e instruções de query específicas por task type. |
| [`memory-embedding-adapter.ts`](./memory-embedding-adapter.ts) | **Adaptador de embedding para memória.** Exporta `ollamaMemoryEmbeddingProviderAdapter` — adaptador que conecta o provider de embeddings Ollama ao sistema de memória vetorial do code. |
| [`media-understanding-provider.ts`](./media-understanding-provider.ts) | **Provider de compreensão de mídia.** Registra o Ollama como provider capaz de descrever imagens (`capabilities: ["image"]`), roteando para modelos de visão configurados pelo usuário (ex: `llava`, `qwen2.5vl`, `llama3.2-vision`). |
| [`web-search-provider.ts`](./web-search-provider.ts) | **Provider de busca na web.** Implementa `createOllamaWebSearchProvider` que usa a API `/api/web_search` (cloud) ou `/api/experimental/web_search` (local) do Ollama. Suporta contagem de resultados configurável (padrão: 5) e autenticação cloud. |
| [`wsl2-crash-loop-check.ts`](./wsl2-crash-loop-check.ts) | **Verificação de risco WSL2.** Detecta se o serviço `ollama.service` está habilitado com `Restart=always` e CUDA visível no WSL2 — combinação que pode causar reinicializações da VM por esgotamento de memória. Emite aviso (`logger.warn`) com mitigações. |

## Arquivos de teste

| Arquivo | O que testa |
|---|---|
| [`discovery-shared.test.ts`](./discovery-shared.test.ts) | Lógica de resolução de discovery (API key, baseUrl, flags de ativação). |
| [`embedding-provider.test.ts`](./embedding-provider.test.ts) | Criação do provider de embeddings, modos local/cloud, autenticação. |
| [`provider-base-url.test.ts`](./provider-base-url.test.ts) | Leitura de `baseUrl`/`baseURL` com diferentes capitalizações. |
| [`provider-models.test.ts`](./provider-models.test.ts) | Listagem, enriquecimento e construção de definições de modelos. |
| [`provider-models.ssrf.test.ts`](./provider-models.ssrf.test.ts) | Política SSRF para URLs do Ollama (bloqueia metadados GCP, permite rede privada). |
| [`setup.test.ts`](./setup.test.ts) | Fluxos de configuração interativo e não-interativo, pull de modelos. |
| [`stream.test.ts`](./stream.test.ts) | Parsing de respostas de streaming, detecção de texto garbled. |
| [`stream-runtime.test.ts`](./stream-runtime.test.ts) | Testes de runtime do streaming (completions, tool calls, thinking, erros). |
| [`web-search-provider.test.ts`](./web-search-provider.test.ts) | Busca na web local e cloud, formatação de resultados. |
| [`wsl2-crash-loop-check.test.ts`](./wsl2-crash-loop-check.test.ts) | Detecção de risco WSL2, parsing de propriedades do systemctl. |

## Contexto de uso

Os módulos desta pasta são importados exclusivamente por `../index.ts` e `../api.ts`. O consumidor externo não deve importar diretamente de `src/` — deve usar as re-exportações em `../api.ts`.

A separação `src/` permite que o `index.ts` seja carregado de forma leve na inicialização, com módulos pesados (como `setup.ts` e `stream.ts`) sendo importados apenas quando necessário.
