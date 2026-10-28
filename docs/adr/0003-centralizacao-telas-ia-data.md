# ADR-0003: Centralização das telas de IA do app data no `chronokairo/ai`

- **Data:** 2026-09-23
- **Status:** Aceito

## Contexto

O app `data` (`dados-ia`), originalmente em `chronokairo/engineering/apps/data`, reunia
em um único monólito rotas de engenharia de dados (ETL, Data Warehouse, Pipelines),
BI (Dashboards, Analytics, Relatórios) e Inteligência Artificial (Modelos de IA, LLMs,
Automação Inteligente, NLP, Visão Computacional e Agentes Autônomos).

Conforme as regras do ecossistema Chronokairo (`AGENTS.md`), o `chronokairo/ai` é a
**fonte única de IA**. Recursos de UI e gestão de IA não devem ser duplicados nem
isolados em produtos periféricos.

## Decisão

1. **Migração das telas de IA**: as 6 telas de IA foram movidas para `chronokairo/ai`
   em `src/modules/ai/data-screens/`:
   - `modelos-ia.tsx` (`ModelosIAScreen`)
   - `llms.tsx` (`LLMsScreen`)
   - `automacao-inteligente.tsx` (`AutomacaoInteligenteScreen`)
   - `nlp.tsx` (`NLPScreen`)
   - `visao-computacional.tsx` (`VisaoComputacionalScreen`)
   - `agentes-autonomos.tsx` (`AgentesAutonomosScreen`)
2. **Exportação via subpath**: `package.json` expõe `./data-screens` mapeado para
   `./src/modules/ai/data-screens/index.ts`. Consumidores importam via
   `chronokairo-desktop/data-screens`.
3. **Consumo no data**: o app `chronokairo/data` remove as screens locais de IA e
   suas rotas `app/(dashboard)/ia/*` passam a importar os componentes diretamente
   de `chronokairo-desktop/data-screens`.

## Consequências

- `chronokairo/ai` consolida a superfície de UI de IA (tanto widgets como telas completas).
- `chronokairo/data` mantém apenas o core de engenharia de dados e BI, consumindo IA via dependência git+npm.
- O build/transpilação dessas telas no Next.js do consumidor é suportado via `transpilePackages: ['chronokairo-desktop']`.
