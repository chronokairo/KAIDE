# packages/llm-ranking/

## Propósito

App **Next.js independente** para recomendar modelos NVIDIA com base em:
- disponibilidade (taxa de sucesso),
- latência (p50/p95),
- tier dinâmico por desempenho real (S/A/B/C),
- recomendação final automática no frontend.

## Arquivos

| Arquivo | Descrição |
|---|---|
| `package.json` | Scripts do app Next.js |
| `app/page.tsx` | Tela React com recomendação geral, separação por empresa e logs em tempo real |
| `app/api/ranking/route.ts` | API para leitura do ranking atual |
| `app/api/ranking/run/route.ts` | API com stream NDJSON para benchmark em tempo real |
| `app/api/ranking/toggle/route.ts` | API para toggle ON/OFF dos modelos com falha de tool |
| `scripts/generate-nvidia-ranking.mjs` | Coleta métricas NVIDIA, calcula score/tier dinâmicos e marca possíveis modelos para remover |
| `data/nvidia-ranking.latest.json` | Saída mais recente gerada pelo script |

## Comportamentos implementados

- Benchmark com logs em tempo real no frontend.
- Descoberta de modelos sem hardcode: somente via `nim list all`.
- Se um modelo retorna `HTTP 404` na primeira rodada, as próximas rodadas desse modelo são puladas.
- Modelos com 404 na primeira rodada entram em `possibleModelsToRemove`.
- Teste de tool calling em 2 turnos (invocação + uso do resultado da tool).
- Se falhar no tool calling (incluindo ignorar resultado da tool/alucinar), entra em `possibleModelsToRemove`.
- Se falhar no tool calling, o benchmark **não testa o restante** (latência/disponibilidade) para o modelo.
- Modelos com falha de tool têm toggle persistente ON/OFF; em OFF, os próximos rankings não testam/consideram o modelo.
- Tier não é fixo: é recalculado a cada execução do benchmark com base em disponibilidade + latência + tool test.
- Resultado inclui ranking global e `modelsByCompany` (ranking separado por empresa).

## Uso

```sh
cd packages/llm-ranking
npm install
nim -h   # precisa estar instalado e no PATH
NVIDIA_API_KEY=... npm run dev
```
