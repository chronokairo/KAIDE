# Implementacao FSD e Testes

## Objetivo
Padronizar o projeto em Feature-Sliced Design (FSD), removendo legado fora das camadas de dominio definidas e garantindo validacao automatizada minima.

## Estrutura FSD Aplicada
- `app/`: camada de composicao do Next.js (entrypoints, layout e estilos globais)
- `entities/`: tipos e contratos de dominio (`agent`)
- `features/`: casos de uso de interface (`agent-console`)
- `processes/`: fluxo de negocio de alto nivel (`agent-runtime`)
- `shared/`: bibliotecas reutilizaveis e cliente de API
- `widgets/`: composicao de blocos visuais (`dashboard`)

## Limpeza de Legado
- Removida a camada antiga `lib/agent` (arquivos legados ja excluidos)
- Mantidos arquivos de plataforma/configuracao (`package.json`, `tsconfig.json`, `next.config.mjs`, etc.)

## Testes Automatizados
Foi adicionada a stack de testes com Vitest.

### Arquivos de teste
- `shared/lib/agent/policy.test.ts`
- `shared/lib/agent/planner.test.ts`

### Cobertura atual
- `validateCommandPolicy`
  - bloqueio de comando destrutivo
  - permissao de comando seguro por modo
  - bloqueio de comando fora da allowlist do modo
- `buildPlanFromPrompt`
  - selecao de plano FastAPI quando a prompt contem "fastapi"
  - fallback para plano bootstrap em prompt generica

### Comandos
```bash
pnpm install
pnpm test
```

## Proximos Passos de Teste
- Adicionar testes para `processes/agent-runtime/model/run-agent.ts` com mock do sandbox
- Adicionar testes de integracao para `app/api/agent/route.ts`
- Adicionar cobertura para estados de erro de rede no `shared/api/agent-client.ts`
