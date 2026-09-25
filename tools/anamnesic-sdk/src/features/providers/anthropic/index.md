# providers/anthropic/

Provider Anthropic para o code. Integra a Claude API com descoberta dinamica de modelos via `GET /v1/models`.

## Proposito

Este plugin conecta o code ao endpoint oficial da Anthropic em `https://api.anthropic.com/v1`.
O provider suporta:

- Chat com modelos Claude via provider nativo
- Descoberta dinamica de modelos no setup, discovery e runtime
- Configuracao por `ANTHROPIC_API_KEY`

## Como ativar

```bash
ANTHROPIC_API_KEY="sk-ant-..." code
```

Ou use o wizard:

```bash
code configure
```

## Arquivos

| Arquivo | Papel |
|---|---|
| [index.ts](./index.ts) | Registro do plugin Anthropic com auth, discovery e cache de modelos dinamicos. |
| [api.ts](./api.ts) | Re-exportacoes publicas do provider. |
| [src/defaults.ts](./src/defaults.ts) | Constantes do provider Anthropic. |
| [src/models.ts](./src/models.ts) | Normalizacao e enriquecimento de modelos live com dados do catalogo. |
| [src/models.fetch.ts](./src/models.fetch.ts) | Fetch do endpoint `GET /v1/models` e mapeamento para configuracao. |
| [src/runtime.ts](./src/runtime.ts) | Resolucao de API key e montagem de headers em runtime. |
| [src/setup.ts](./src/setup.ts) | Setup interativo, setup nao interativo, discovery e preparo de modelos dinamicos. |
| [index.test.ts](./index.test.ts) | Testes do registro principal do plugin. |
| [plugin-registration.contract.test.ts](./plugin-registration.contract.test.ts) | Teste de contrato do plugin. |

## Contexto de uso

- O discovery live usa o endpoint oficial de modelos da Anthropic.
- O provider persiste a configuracao em `models.providers.anthropic` e resolve o modelo dinamico em runtime.
- O catalogo live pode ser enriquecido com dados do `models.dev` quando disponivel, sem depender de manifesto estatico.