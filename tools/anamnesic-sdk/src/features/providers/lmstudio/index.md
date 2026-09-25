# providers/lmstudio/

Provider **LM Studio** para o code — integra o servidor local do [LM Studio](https://lmstudio.ai) como backend de inferência para modelos de linguagem abertos rodando localmente.

## Propósito

Este plugin conecta o code ao servidor LM Studio, que expõe uma API compatível com OpenAI em `http://localhost:1234`. O provider suporta:

- **Chat e completions** via API OpenAI-compatível (`/v1/chat/completions`)
- **Embeddings vetoriais** (padrão: `text-embedding-nomic-embed-text-v1.5`)
- **Descoberta dinâmica de modelos** via `/api/v0/models` do LM Studio
- **Preload de modelos** — carrega automaticamente o modelo no LM Studio antes de iniciar o streaming
- **Tool calls em texto plano** — fallback para modelos que não suportam tool calling nativo via JSON

## Como ativar

```bash
# Opção 1 — variável de ambiente
LM_API_TOKEN="lmstudio-local" code

# Opção 2 — wizard interativo
code configure
# Selecione "LM Studio" como provider

# Opção 3 — code.json (com models.providers.lmstudio configurado)
# O provider usa autenticação sintética quando modelos lmstudio estão declarados
```

A variável `CHRONOKAIRO_USE_LMSTUDIO=1` também pode ser usada para forçar a ativação.

## Arquivos

| Arquivo | Papel |
|---|---|
| [`index.ts`](./index.ts) | **Ponto de entrada do plugin.** Define e registra o provider via `definePluginEntry`. Implementa autenticação (interativa e não-interativa), descoberta de modelos, preload de modelo via `wrapLmstudioInferencePreload`, embeddings, e catálogo aumentado de modelos configurados. Os helpers de setup são carregados de forma lazy (`api.js`) para manter o startup leve. |
| [`api.ts`](./api.ts) | **API pública do provider.** Re-exporta funções e constantes de `src/api.ts` para consumo externo: URLs padrão, funções de setup e descoberta, helpers de autenticação e runtime. |
| [`memory-embedding-adapter.ts`](./memory-embedding-adapter.ts) | **Adaptador de embedding para memória.** Conecta o provider de embeddings LM Studio ao sistema de memória vetorial do code. |
| [`runtime-api.ts`](./runtime-api.ts) | **API de runtime.** Re-exporta funções de resolução de contexto de requisição (headers, API key) para uso em runtime. |
| [`package.json`](./package.json) | Manifesto do pacote Node.js do plugin. |
| [`index.test.ts`](./index.test.ts) | Testes de integração do plugin principal. |
| [`plugin-registration.contract.test.ts`](./plugin-registration.contract.test.ts) | Teste de contrato de registro do plugin. |

## Subpasta `src/`

Contém a implementação interna detalhada. Veja [`src/index.md`](./src/index.md) para documentação completa.

## Contexto de uso

- **Endpoint padrão:** `http://localhost:1234` (server base) e `http://localhost:1234/v1` (inference base).
- **Docker:** Em ambientes Docker, usa `http://host.docker.internal:1234`.
- **Autenticação:** LM Studio local não exige chave de API real. O sistema usa o placeholder `lmstudio-local` para indicar autenticação local sem credencial real.
- **Preload com backoff:** O wrapper de streaming tenta pré-carregar o modelo no LM Studio antes de cada inferência. Em caso de falha repetida, aplica backoff exponencial (de 5 s até 5 min) para evitar spam de logs.
- **Catálogo de modelos:** Modelos podem ser declarados explicitamente em `models.providers.lmstudio.models` no `code.json`, além dos descobertos dinamicamente via API.
