# providers/ollama/

Provider **Ollama** para o code — integra o runtime local e cloud do [Ollama](https://ollama.com) como backend de inferência de modelos de linguagem abertos.

## Propósito

Este plugin conecta o code ao servidor Ollama, que pode estar rodando localmente em `http://127.0.0.1:11434` ou em uma instância remota/cloud em `https://ollama.com`. O provider suporta:

- **Chat e completions** via protocolo nativo Ollama e via compatibilidade OpenAI (`openai-completions`)
- **Embeddings vetoriais** (padrão: `nomic-embed-text`)
- **Busca na web** via API experimental do Ollama
- **Compreensão de mídia** (imagens), roteando para modelos de visão como `llava`, `qwen2.5vl` ou `llama3.2-vision`
- **Modelos dinâmicos** — detecção automática dos modelos disponíveis no servidor Ollama

## Como ativar

```bash
# Opção 1 — variável de ambiente (qualquer valor é válido)
OLLAMA_API_KEY="ollama-local" code

# Opção 2 — wizard interativo
code configure

# Opção 3 — arquivo code.json
# O provider é descoberto automaticamente quando OLLAMA_API_KEY está configurado
```

A variável `CHRONOKAIRO_USE_OLLAMA=1` também pode ser usada para forçar a ativação.

## Arquivos

| Arquivo | Papel |
|---|---|
| [`index.ts`](./index.ts) | **Ponto de entrada do plugin.** Define e registra o provider via `definePluginEntry`. Implementa o fluxo de autenticação (interativo e não-interativo), descoberta de modelos, streaming, embeddings, busca na web, e modelos dinâmicos. |
| [`api.ts`](./api.ts) | **API pública do provider.** Re-exporta funções e tipos internos de `src/` para consumo externo: constantes padrão, funções de setup (`buildOllamaProvider`, `promptAndConfigureOllama`), e helpers de streaming. |
| [`provider-discovery.ts`](./provider-discovery.ts) | **Descoberta de provider.** Exporta `ollamaProviderDiscovery` — objeto com ID, label, variáveis de ambiente, autenticação sintética e lógica de discovery em modo `"late"`. Usado em contextos de catálogo sem o plugin completo. |
| [`provider-policy-api.ts`](./provider-policy-api.ts) | **Políticas de provider.** Exporta helpers de política relacionados ao provider Ollama (ex: replay policy para compatibilidade OpenAI). |
| [`runtime-api.ts`](./runtime-api.ts) | **API de runtime.** Expõe funções de resolução de contexto de requisição usadas em tempo de execução. |
| [`web-search-contract-api.ts`](./web-search-contract-api.ts) | **Contrato de busca na web.** Define o contrato de interface para o provider de busca web do Ollama. |
| [`web-search-provider.ts`](./web-search-provider.ts) | **Re-exportação do provider de busca.** Aponta para a implementação em `src/web-search-provider.ts`. |
| [`package.json`](./package.json) | Manifesto do pacote Node.js do plugin. |
| [`tsconfig.json`](./tsconfig.json) | Configuração TypeScript do plugin. |
| [`index.test.ts`](./index.test.ts) | Testes unitários e de integração do plugin principal. |
| [`ollama.live.test.ts`](./ollama.live.test.ts) | Testes de integração ao vivo contra um servidor Ollama real. |
| [`provider-discovery.test.ts`](./provider-discovery.test.ts) | Testes de descoberta do provider. |
| [`provider-discovery.import-guard.test.ts`](./provider-discovery.import-guard.test.ts) | Testes de guarda de importação (verifica que dependências pesadas não são importadas no caminho crítico). |
| [`plugin-registration.contract.test.ts`](./plugin-registration.contract.test.ts) | Teste de contrato de registro do plugin. |
| [`provider-policy-api.test.ts`](./provider-policy-api.test.ts) | Testes das políticas de provider. |

## Subpasta `src/`

Contém a implementação interna detalhada. Veja [`src/index.md`](./src/index.md) para documentação completa de cada módulo.

## Contexto de uso

- **Modo local:** Por padrão, conecta a `http://127.0.0.1:11434`. Em ambientes Docker, usa `http://host.docker.internal:11434`.
- **Modo cloud:** Suporta instâncias remotas Ollama (ex: `https://ollama.com`), com modelos como `kimi-k2.5:cloud`, `minimax-m2.7:cloud`.
- **Autenticação:** Ollama local não requer chave real. O sistema usa a chave sintética `ollama-local` para sinalizar ao runtime que o provider está configurado sem expor credenciais.
- **WSL2:** O provider inclui detecção de risco de crash-loop no WSL2 com CUDA ativo (`wsl2-crash-loop-check.ts`).
- **Thinking/Raciocínio:** Suporta modelos com raciocínio nativo (níveis: off, low, medium, high, max).
