# providers/nvidia/

Provider **NVIDIA** para o code — integra a [NVIDIA NIM API](https://build.nvidia.com) para acesso a modelos de linguagem de alto desempenho hospedados pela NVIDIA na nuvem.

## Propósito

Este plugin conecta o code à infraestrutura de IA da NVIDIA, disponível em `https://integrate.api.nvidia.com`. Diferentemente dos providers locais (Ollama, LM Studio), o provider NVIDIA é exclusivamente em **nuvem** e requer uma **chave de API** (`NVIDIA_API_KEY`) obtida em [build.nvidia.com](https://build.nvidia.com).

O provider suporta:

- **Chat e completions** via API compatível com OpenAI (protocolo `openai-completions`)
- **Descoberta dinâmica de modelos** via `GET /v1/models` no setup, model picker e runtime
- **Catálogo seed** em código como fallback compatível quando a descoberta live não estiver disponível
- **Modelos de raciocínio** com suporte a thinking/chain-of-thought
- **Modelos multimodais** com suporte a entrada de imagens

## Como ativar

```bash
# Opção 1 — variável de ambiente
NVIDIA_API_KEY="nvapi-xxxxxxxxxxxx" code

# Opção 2 — wizard interativo
code configure
# Selecione "NVIDIA API key" como método de autenticação

# Opção 3 — flag de linha de comando
code --nvidia-api-key nvapi-xxxxxxxxxxxx

# A chave pode ser obtida gratuitamente em: https://build.nvidia.com
```

A variável `CHRONOKAIRO_USE_NVIDIA=1` também pode ser usada para forçar a ativação.

## Arquivos

| Arquivo | Papel |
|---|---|
| [`index.ts`](./index.ts) | **Ponto de entrada do plugin.** Registra o provider via `definePluginEntry` com auth custom, discovery live, cache de modelos dinâmicos e wizard de configuração. |
| [`api.ts`](./api.ts) | **API pública do provider.** Re-exporta o catálogo seed, onboarding e os helpers de setup/runtime/modelos dinâmicos. |
| [`onboard.ts`](./onboard.ts) | **Configuração e onboarding.** Define `NVIDIA_DEFAULT_MODEL_REF` e cria os appliers de preset de modelos via `createDefaultModelsPresetAppliers`. Funções `applyNvidiaConfig` e `applyNvidiaProviderConfig` aplicam a configuração de provider e modelo padrão ao `code.json`. |
| [`provider-catalog.ts`](./provider-catalog.ts) | **Catálogo seed do NVIDIA.** Constrói a configuração padrão do provider sem depender de manifesto externo e preserva compatibilidade com o onboarding existente. |
| [`src/defaults.ts`](./src/defaults.ts) | Constantes do provider NVIDIA. |
| [`src/models.ts`](./src/models.ts) | Normalização e enriquecimento de modelos live e seed com dados do catálogo. |
| [`src/models.fetch.ts`](./src/models.fetch.ts) | Fetch do endpoint `GET /v1/models` e mapeamento para configuração. |
| [`src/runtime.ts`](./src/runtime.ts) | Resolução de API key e headers de autenticação bearer. |
| [`src/setup.ts`](./src/setup.ts) | Setup interativo, setup não interativo, discovery e preparo dos modelos dinâmicos. |
| [`package.json`](./package.json) | Manifesto do pacote Node.js do plugin. |
| [`tsconfig.json`](./tsconfig.json) | Configuração TypeScript do plugin. |
| [`index.test.ts`](./index.test.ts) | Testes do plugin principal (registro, catálogo, wizard). |
| [`onboard.test.ts`](./onboard.test.ts) | Testes das funções de onboarding e aplicação de configuração. |
| [`provider-catalog.test.ts`](./provider-catalog.test.ts) | Testes do catálogo de modelos NVIDIA. |
| [`plugin-registration.contract.test.ts`](./plugin-registration.contract.test.ts) | Teste de contrato de registro do plugin. |

> **Nota:** O NVIDIA provider agora possui uma subpasta `src/` para concentrar setup, runtime e descoberta dinâmica, mas mantém a superfície pública anterior para compatibilidade.

## Contexto de uso

- **Endpoint de API:** `https://integrate.api.nvidia.com/v1`
- **Autenticação:** Requer `NVIDIA_API_KEY` válida. A chave pode ser configurada via env var, flag CLI ou wizard interativo.
- **Modelos:** O provider prioriza a lista live exposta pelo endpoint de modelos da NVIDIA. Quando isso não está disponível, cai para um catálogo seed em código para preservar a experiência de onboarding.
- **Discovery em runtime:** O model picker e a resolução dinâmica de modelos passam a consultar a API live da NVIDIA.
- **preserveLiteralProviderPrefix:** O ID do provider nos modelos é preservado como `nvidia/` (ex: `nvidia/nemotron-3-super-120b-a12b`), não normalizado.
