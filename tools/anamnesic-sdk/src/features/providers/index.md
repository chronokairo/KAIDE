# providers/

Catálogo de plugins de provider de IA do **code**. Cada subpasta é um plugin autocontido que integra o code com um backend de inferência diferente — local ou em nuvem.

## Propósito

A pasta `providers/` é o ponto de extensão principal do code para suporte a modelos de linguagem. Cada provider é empacotado de forma independente com seu próprio `package.json`, `index.ts` e suite de testes, seguindo o contrato da **Plugin SDK** (`code/plugin-sdk`).

Os providers são ativados via **variável de ambiente** ou **configuração** no arquivo `code.json`. A convenção de ativação explícita é:

```
CHRONOKAIRO_USE_<NOME>=1
```

## Subpastas

| Pasta | Backend | Tipo | Porta padrão |
|---|---|---|---|
| [`ollama/`](./ollama/) | [Ollama](https://ollama.com) | Local / Cloud | `localhost:11434` |
| [`lmstudio/`](./lmstudio/) | [LM Studio](https://lmstudio.ai) | Local | `localhost:1234` |
| [`anthropic/`](./anthropic/) | [Anthropic Claude API](https://platform.claude.com/docs) | Cloud | `api.anthropic.com` |
| [`nvidia/`](./nvidia/) | [NVIDIA NIM API](https://build.nvidia.com) | Cloud | `integrate.api.nvidia.com` |
| [`ollama-cloud/`](./ollama-cloud/) | Ollama (variante cloud) | Cloud | `ollama.com` |

## Estrutura comum de cada plugin

Cada subpasta segue a seguinte convenção:

```
<provider>/
├── index.ts                  # Ponto de entrada do plugin (definePluginEntry)
├── api.ts                    # Re-exportações públicas da API do provider
├── package.json              # Manifesto do pacote Node.js
├── tsconfig.json             # Configuração TypeScript
├── *.test.ts                 # Testes de integração e unitários
└── src/                      # Implementação interna
    ├── defaults.ts           # Constantes e valores padrão
    ├── setup.ts              # Fluxo de configuração interativo/não-interativo
    ├── stream.ts             # Função de streaming de inferência
    ├── provider-models.ts    # Descoberta e listagem de modelos
    └── embedding-provider.ts # Suporte a embeddings vetoriais
```

## Contexto de uso

- Os providers são carregados pelo runtime do code (`source/src`) durante a inicialização.
- O **wizard de configuração** (`code configure`) usa os providers registrados para guiar o usuário na escolha de backend e modelo.
- A descoberta automática de modelos (`discovery.run`) ocorre com ordem `"late"` nos providers locais para não interferir com providers remotos que têm prioridade mais alta.
- Cada provider pode registrar: **modelos de chat**, **embeddings**, **busca na web** e **compreensão de mídia** (imagens).
